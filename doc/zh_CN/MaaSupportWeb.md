# MaaSupportWeb

## 主要功能

* 连接控制器、加载资源、执行任务，查看任务执行情况
  * 支持Adb和Win32
* 内建文件管理，可上传、下载资源文件
* 基于UI的Task编辑
* 截图以及获取ROI
  * 支持使用已连接的控制器直接获取截图
  * 支持自行上传截图

## 使用指南

### 启动MaaHttp

下载最新的[流水线产物](https://github.com/MaaXYZ/MaaFramework/actions/workflows/build.yml?query=branch%3Amain)，解压后打开bin/MaaHttp程序。

### 访问MaaSupportWeb

访问[https://neko-para.github.io/maa-support/](https://neko-para.github.io/maa-support/)

### 配置MaaAgentBinary

如果需要使用Adb控制器，需要配置MaaAgentBinary。在左侧第三个tab中，将之前下载的流水线产物中share/MaaAgentBinary目录的路径复制到对应选项中。

### 配置实例

在左侧第一个tab中，使用加号可创建新的配置实例。

### 管理文件

在左侧第二个tab中，可管理文件等资源。上传需要使用不包含外部文件夹的zip。通过下拉框可以切换不同的文件系统。

### 编辑Task

选中pipeline目录下的json后，右侧会出现任务编辑界面。使用下拉框选择任务，或者使用加号创建新的任务。点击某一项的名称，会清除该项配置。

### 截图

当配置并激活（选中）一个连接了控制器的实例后，右侧的截图界面中的screencap按钮会被启用，可以直接从对应来源获取截图。

截图完成后，可使用download直接下载截图，或使用raise将图片存入内部文件系统，对应的ROI会存放在旁边。
