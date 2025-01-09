export default defineEventHandler(() => {
  console.log("DB_HOST:", process.env.DB_HOST);

  return {
    message: "Hello from Nuxt Server API!",
  };
});
