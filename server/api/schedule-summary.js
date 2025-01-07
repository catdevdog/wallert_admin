// server/api/schedule-summary.js
import db from "../db";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // 1. 브랜드별 세팅 주기 계산
    const [cycles] = await db.query(`
      WITH SettingDates AS (
        SELECT 
          brand_name,
          name_kr,
          wall_name,
          date,
          LEAD(date) OVER (
            PARTITION BY brand_name, wall_name 
            ORDER BY date
          ) as next_date
        FROM schedules
        WHERE type = 'SETTING'
      ),
      CycleSummary AS (
        SELECT 
          brand_name,
          name_kr,
          wall_name,
          ROUND(AVG(DATEDIFF(next_date, date))) as avg_cycle,
          COUNT(*) as setting_count
        FROM SettingDates
        WHERE next_date IS NOT NULL
        GROUP BY brand_name, name_kr, wall_name
      )
      SELECT * FROM CycleSummary
    `);

    // 2. 브랜드별 다음 세팅 일정
    const [nextSettings] = await db.query(`
      WITH NextSchedules AS (
        SELECT 
          s1.*,
          ROW_NUMBER() OVER (
            PARTITION BY s1.brand_name 
            ORDER BY s1.date ASC
          ) as rn
        FROM schedules s1
        WHERE s1.type = 'SETTING' 
        AND s1.date > CURRENT_DATE()
      )
      SELECT * FROM NextSchedules WHERE rn = 1
      ORDER BY date ASC
    `);

    // 3. 데이터 결합
    const combinedData = new Map();

    // 평균 주기 데이터 처리
    cycles.forEach((cycle) => {
      if (!combinedData.has(cycle.brand_name)) {
        combinedData.set(cycle.brand_name, {
          brand_name: cycle.brand_name,
          name_kr: cycle.name_kr,
          walls: {},
          next_setting: null,
        });
      }

      combinedData.get(cycle.brand_name).walls[cycle.wall_name] = {
        avg_cycle: cycle.avg_cycle,
        setting_count: cycle.setting_count,
      };
    });

    // 다음 세팅 일정 추가
    nextSettings.forEach((setting) => {
      if (!combinedData.has(setting.brand_name)) {
        combinedData.set(setting.brand_name, {
          brand_name: setting.brand_name,
          name_kr: setting.name_kr,
          walls: {},
          next_setting: null,
        });
      }

      combinedData.get(setting.brand_name).next_setting = {
        date: setting.date,
        wall_name: setting.wall_name,
      };
    });

    return Array.from(combinedData.values());
  } catch (error) {
    console.error("Error in schedule-summary:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch schedule summary",
    });
  }
});
