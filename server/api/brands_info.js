import db from "../db";
import { createError } from "h3";

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

// 유틸리티 함수: wall_names 검증
const validateWallNames = (wallNames) => {
  try {
    if (typeof wallNames === "string") {
      const parsed = JSON.parse(wallNames);
      if (!Array.isArray(parsed)) {
        throw new Error("wall_names must be an array");
      }
      return parsed;
    }
    if (!Array.isArray(wallNames)) {
      throw new Error("wall_names must be an array");
    }
    return wallNames;
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid wall_names format",
    });
  }
};

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method;

    // GET 요청 처리
    if (method === "GET") {
      const query = getQuery(event);

      // name 파라미터가 있으면 단일 브랜드 조회
      if (query.name) {
        const [rows] = await db.query(
          "SELECT * FROM brands_info WHERE name = ?",
          [query.name]
        );

        if (rows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: "브랜드를 찾을 수 없습니다.",
          });
        }

        const brand = rows[0];
        return {
          ...brand,
          wall_names: brand.wall_names ? JSON.parse(brand.wall_names) : [],
        };
      }

      // 전체 브랜드 조회
      const [rows] = await db.query(
        "SELECT * FROM brands_info ORDER BY name_kr ASC"
      );
      return rows;
    }

    // POST 요청 처리
    if (method === "POST") {
      const body = await readBody(event);

      // 필수 필드 검증
      validateRequiredFields(body, ["name", "brand", "name_kr"]);

      // wall_names 검증 및 변환
      const wallNames = validateWallNames(body.wall_names || []);

      // 인스타 계정명 중복 체크
      const [[existing]] = await db.query(
        "SELECT name FROM brands_info WHERE name = ?",
        [body.name]
      );

      if (existing) {
        throw createError({
          statusCode: 409,
          statusMessage: "이미 존재하는 인스타 계정입니다.",
        });
      }

      const [result] = await db.query(
        `INSERT INTO brands_info 
        (name, brand, name_kr, wall_names, profile_image) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          body.name,
          body.brand,
          body.name_kr,
          JSON.stringify(wallNames),
          body.profile_image || null,
        ]
      );

      const [[inserted]] = await db.query(
        "SELECT * FROM brands_info WHERE name = ?",
        [body.name]
      );

      return {
        ...inserted,
        wall_names: wallNames,
      };
    }

    // PUT 요청 처리
    if (method === "PUT") {
      const body = await readBody(event);

      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: "name is required for updating",
        });
      }

      validateRequiredFields(body, ["brand", "name_kr"]);
      const wallNames = validateWallNames(body.wall_names || []);

      const [result] = await db.query(
        `UPDATE brands_info 
        SET brand = ?, 
            name_kr = ?, 
            wall_names = ?,
            profile_image = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE name = ?`,
        [
          body.brand,
          body.name_kr,
          JSON.stringify(wallNames),
          body.profile_image || null,
          body.name,
        ]
      );

      if (result.affectedRows === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "브랜드를 찾을 수 없습니다.",
        });
      }

      const [[updated]] = await db.query(
        "SELECT * FROM brands_info WHERE name = ?",
        [body.name]
      );

      return {
        ...updated,
        wall_names: wallNames,
      };
    }

    // DELETE 요청 처리
    if (method === "DELETE") {
      const query = getQuery(event);

      if (!query.name) {
        throw createError({
          statusCode: 400,
          statusMessage: "name is required for deletion",
        });
      }

      // 삭제 전에 존재 여부 확인
      const [[existing]] = await db.query(
        "SELECT name FROM brands_info WHERE name = ?",
        [query.name]
      );

      if (!existing) {
        throw createError({
          statusCode: 404,
          statusMessage: "브랜드를 찾을 수 없습니다.",
        });
      }

      const [result] = await db.query(
        "DELETE FROM brands_info WHERE name = ?",
        [query.name]
      );

      return {
        success: true,
        message: "브랜드가 삭제되었습니다.",
      };
    }

    // 지원하지 않는 메서드
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  } catch (error) {
    // 이미 H3 에러인 경우 그대로 던지기
    if (error.statusCode) {
      throw error;
    }

    console.error("Database error:", error);

    // MySQL 특정 에러 처리
    if (error.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "중복된 데이터가 존재합니다.",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
