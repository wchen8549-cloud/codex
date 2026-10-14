# 47天国考冲刺管理系统

手机优先的个人备考与健康记录应用。React、TypeScript、Tailwind CSS；数据保存在设备本地，没有账户同步。

功能：首页倒计时、每日计划、学习计时和记录、恢复动作打卡、体重/步数/饮食/补剂记录、周/月报告与趋势图。

## 下载 Android APK

1. 打开仓库的 Actions，选择 **Build Android APK**。
2. 等待运行显示绿色成功；失败的运行没有可用安装包。
3. 在成功运行页面的 Artifacts 下载 **sprint47-android-apk**。
4. 解压 ZIP，将其中的 APK 传到安卓手机，按系统提示安装。

第一次上传或推送到 main 会自动构建，也可使用 Run workflow 手动构建。云端准备 Node 24、pnpm 11.25、JDK 21 和 Android SDK 36，本机无需安装 Android 构建工具。

这是个人测试用 debug 签名 APK，并非商店发布版。当前云端的调试签名密钥没有持久化，后续重新构建可能无法直接覆盖旧包；不要为解决签名不一致而直接卸载已有数据的旧应用。正式持续更新需配置持久化签名。

网页版本和 APK 的本地记录互相独立。卸载应用或清除应用数据可能丢失记录；本版本尚无数据导出或云同步。当前提醒为页面内提示，不提供后台通知。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
node scripts/run-project.cjs build-android
node scripts/run-android.cjs apk
```

Android 模式内置网页资源，关闭 Service Worker 和网页安装提示，不依赖外部网站。源码仓库不包含个人实际打卡记录、电脑构建缓存、签名私钥或本机路径配置。
