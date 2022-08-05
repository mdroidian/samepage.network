import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";

const deleteOnlineClient = async (id: string) => {
  const cxn = await getMysqlConnection();
  await cxn.execute(`DELETE FROM online_clients WHERE id = ?`, [id]);
  cxn.destroy();
  return { success: true };
};

export default deleteOnlineClient;
