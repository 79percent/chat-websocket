const ws = require("nodejs-websocket");
console.log("开始建立连接...")

const queueItem = {
  userId: null,// 发起连接的userId
  targetId: null,// 连接目标的targetId
  userConn: null,// userConn对象
  targetConn: null,// targetConn对象
  userReady: false,// userReady状态，可理解为在线状态
  targetReady: false,// targetReady状态，可理解为在线状态
}
const queue = [];

/**
 * 查找队列中是否已经存在该连接,返回下标
 * @param {*} userId 
 * @param {*} targetId 
 * @return {index OR -1}
 */
const findConnIndex = (userId, targetId) => {
  const index = queue.findIndex(item => (
    (item.userId === userId && item.targetId === targetId)
    || (item.userId === targetId && item.targetId === userId)
  ));
  return index;
}

const server = ws.createServer((conn) => {
  conn.on("text", (str) => {
    let data = {};
    try {
      data = JSON.parse(str);
    } catch (error) {
    }
    const { userId, targetId, message } = data;
    const connInex = findConnIndex(userId, targetId);
    if (connInex === -1) {
      console.log('队列中不存在')
      // 发起用户和目标用户不在队列中，则添加到队列中
      queue.push({
        userId,
        targetId,
        userConn: conn,
        targetConn: null,
        userReady: false,
        targetReady: false,
      })
    } else {
      // 如果已经在队列中
      // 判断当前发送信息的是队列中的user还是target
      if (userId === queue[connInex].userId && targetId === queue[connInex].targetId) {
        // 队列中的userId和当前发送消息的用户userId一致
        queue[connInex].userReady = true;
        queue[connInex].userConn = conn;
      }
      if (userId === queue[connInex].targetId && targetId === queue[connInex].userId) {
        // 队列中的targetId和当前发送消息的用户userId一致
        queue[connInex].targetReady = true;
        queue[connInex].targetConn = conn;
      }
      if (message !== undefined) {
        const data = JSON.stringify({
          id: userId,
          msg: message,
        });
        if (queue[connInex].userReady) {
          queue[connInex].userConn.sendText(data);
        }
        if (queue[connInex].targetReady) {
          queue[connInex].targetConn.sendText(data);
        }
      }
    }
  })

  conn.on("close", (code, reason) => {
    console.log("关闭连接")
  });

  conn.on("error", (code, reason) => {
    console.log("异常关闭")
  });
}).listen(8001);
console.log("WebSocket服务开启成功")