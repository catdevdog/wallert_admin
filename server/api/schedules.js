import db from "../db";

export default defineEventHandler(async (event) => {
  const method = event.node.req.method; // HTTP 메서드 확인

  if (method === "GET") {
    // GET 요청: 모든 설정을 조회
    const [rows] = await db.query("SELECT * FROM schedules");
    return rows;
  }

  if (method === "POST") {
    // POST 요청: 새로운 설정 추가
    const body = await readBody(event); // 요청 바디 읽기
    const { brand_name, name_kr, wall_name, type, date, description } = body;

    const [result] = await db.query(
      "INSERT INTO schedules (brand_name, name_kr, wall_name, type, date, description) VALUES (?, ?, ?, ?, ?, ?)",
      [brand_name, name_kr, wall_name, type, date, description]
    );

    return { success: true, id: result.insertId };
  }

  // 다른 메서드 처리 안함
  return {
    success: false,
    message: "Unsupported method",
  };
});
