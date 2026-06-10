const TOPIC_ID = "1781081445407-rn7t0n7";
async function test() {
  console.log("=== 1. 创建脚本 ===");
  const r1 = await fetch(`http://localhost:3005/api/topics/${TOPIC_ID}/scripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: TOPIC_ID, content: "测试脚本内容", version: 1, status: "draft", author_id: "u1", author_name: "品牌负责人" })
  });
  console.log(JSON.stringify(await r1.json(), null, 2));

  console.log("\n=== 2. 创建时间轴 ===");
  const r2 = await fetch(`http://localhost:3005/api/topics/${TOPIC_ID}/timeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id: TOPIC_ID, event_type: "script_submitted", actor_id: "u1", actor_name: "品牌负责人", description: "脚本 v1 提交", metadata: { version: 1 } })
  });
  console.log(JSON.stringify(await r2.json(), null, 2));

  console.log("\n=== 3. 读取脚本列表 ===");
  const r3 = await fetch(`http://localhost:3005/api/topics/${TOPIC_ID}/scripts`);
  console.log(JSON.stringify(await r3.json(), null, 2));

  console.log("\n=== 4. 读取时间轴 ===");
  const r4 = await fetch(`http://localhost:3005/api/topics/${TOPIC_ID}/timeline`);
  console.log(JSON.stringify(await r4.json(), null, 2));
}
test().catch(console.error);
