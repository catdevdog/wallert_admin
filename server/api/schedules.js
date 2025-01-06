import db from "../db";
import { createError } from "h3";

// 유틸리티 함수: 날짜 유효성 검사
const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

// 유틸리티 함수: 필수 필드 검증
const validateRequiredFields = (data, fields) => {
  const missing = fields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(", ")}`,
    });
  }
};

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method;

    // GET 요청 처리
    if (method === "GET") {
      const [rows] = await db.query(
        "SELECT * FROM schedules ORDER BY date DESC"
      );
      return rows;
    }

    // POST 요청 처리
    if (method === "POST") {
      const body = await readBody(event);

      // 필수 필드 검증
      validateRequiredFields(body, [
        "brand_name",
        "name_kr",
        "wall_name",
        "type",
        "date",
      ]);

      // 날짜 형식 검증
      if (!isValidDate(body.date)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid date format",
        });
      }

      // type 유효성 검증
      const validTypes = ["SETTING", "REMOVAL", "EVENT"];
      if (!validTypes.includes(body.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid schedule type",
        });
      }

      const [result] = await db.query(
        `INSERT INTO schedules 
        (brand_name, name_kr, wall_name, type, date, description) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          body.brand_name,
          body.name_kr,
          body.wall_name,
          body.type,
          body.date,
          body.description || null,
        ]
      );

      const [[inserted]] = await db.query(
        "SELECT * FROM schedules WHERE id = ?",
        [result.insertId]
      );

      return inserted;
    }

    // PUT 요청 처리
    if (method === "PUT") {
      const body = await readBody(event);

      if (!body.id) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID is required for updating",
        });
      }

      validateRequiredFields(body, [
        "brand_name",
        "name_kr",
        "wall_name",
        "type",
        "date",
      ]);

      if (!isValidDate(body.date)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid date format",
        });
      }

      const validTypes = ["SETTING", "REMOVAL", "EVENT"];
      if (!validTypes.includes(body.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid schedule type",
        });
      }

      const [result] = await db.query(
        `UPDATE schedules 
        SET brand_name = ?, 
            name_kr = ?, 
            wall_name = ?, 
            type = ?, 
            date = ?, 
            description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          body.brand_name,
          body.name_kr,
          body.wall_name,
          body.type,
          body.date,
          body.description || null,
          body.id,
        ]
      );

      if (result.affectedRows === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Schedule not found",
        });
      }

      const [[updated]] = await db.query(
        "SELECT * FROM schedules WHERE id = ?",
        [body.id]
      );

      return updated;
    }

    // DELETE 요청 처리
    if (method === "DELETE") {
      const query = getQuery(event);

      if (!query.id) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID is required for deletion",
        });
      }

      const [result] = await db.query("DELETE FROM schedules WHERE id = ?", [
        query.id,
      ]);

      if (result.affectedRows === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "Schedule not found",
        });
      }

      return {
        success: true,
        message: "Schedule deleted successfully",
      };
    }

    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    // 이미 H3 에러인 경우 그대로 던지기
    if (error.statusCode) {
      throw error;
    }

    // DB 에러 처리
    console.error("Database error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
