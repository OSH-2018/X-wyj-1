# 基于CRDT的多人实时协作编辑器
## 简介
## 关于权限管理
* 用户分为admin与guest，admin是唯一的，其余为guest
* 第一个登陆的人自动设为admin，一旦admin退出（离线），admin按顺序继承给下一个guest
* admin拥有完全编辑权限，并可划分区域，区域格式为\g{i}\ \g{i}\，i代表guest{i}，即guest{i}只能在该区域中间（不包括区域标识符）编辑
* 特别地，\g\ \g\表示公共编辑区域

## 部署与启动
请确保您已安装Node.js
```
npm install
node app.js
```
