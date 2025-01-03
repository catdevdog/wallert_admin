import db from "../db";

export default defineEventHandler(async () => {
  const [rows] = await db.query("SELECT * FROM brands");
  return rows;
});
