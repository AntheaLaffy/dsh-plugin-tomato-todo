---
name: publish-portability
description: >
  发布前自检：发布物（npm 包、装载补丁、tarball、市场条目）不得写死作者机器环境；
  默认值运行时推导，子进程继承宿主环境，前置依赖与副作用如实披露，发布后拆包核对并
  用回归测试锁住契约。Use when preparing a release, publishing a plugin or package,
  tagging a version, or writing a marketplace entry / PR description.
  触发于「发版/发布/上架市场/写条目描述/打 tag」。
---

# 发布可移植性：装得上 ≠ 装完能用

主线：发布物里任何「作者机器的事实」——家目录、用户名、绝对路径、钉死的环境变量——
都会让别人的机器「能装、功能全断」。更糟的是这类 bug 在作者机器上永远测不出来：
作者的环境恰好就是写死的那一个。所以发布前必须强制用「别人机器」的视角过一遍，
而且验的是**发布物**（tarball / registry 里的包），不是仓库；仓库干净 ≠ 包干净。

## 事故档案：0.14.0 → 0.14.1（本仓库真实案例）

市场评审（PR 13143 评论 6760483320）复验时拆包发现：插件装上之后 13 个
`tomato_*` 工具在非作者账号上全断，原因是发布物写死了作者家目录。

**写死了什么（三处）**

- `plugin/index.js:22`：`DEFAULT_BIN = "/home/fuurin/.local/bin/tomato-runtime"`。
- `plugin/index.js:35,68`：`RUNTIME_HOME = "/home/fuurin"` + 子进程
  `env: { HOME: RUNTIME_HOME }`——常量，没有任何配置项能改。
- `plugin/cordis.patch.yml:9`：`tomatoBin: /home/fuurin/...`，装包时被
  insert 进用户的 profile，等于替每个用户选了错误答案。
- npm 0.14.0 的 tarball 同样如此（评审自己拆包核对过，不是只看仓库猜的）。

**后果链（评审怎么追的）**

- runtime 的 `--mcp` 只是转发器：读 `join(dataDir, "agent", "connection.json")`
  （`runtime/src/main.mjs:117`），dataDir 默认 `$XDG_DATA_HOME || $HOME/.local/share`。
- 插件把子进程 HOME 钉成作者家目录 → 非作者用户要么找不到可执行文件、要么
  读不到连接文件（报「请先启动番茄 Todo…」）→「对话助手可读写与界面相同的
  本地记录」这个插件存在的理由，装完即不成立。

**评审还抓了什么**

- 市场描述没提前置：runtime（Node）与 guard（Rust）不在 npm 包里，要另装
  Linux 发行包并 `systemctl --user enable --now tomato-runtime`。描述里
  「装完即用」的隐含承诺一句话都没兑现。
- 副作用披露：`link-skills.js:39-43` 默认往 `~/.codex`、`~/.claude`、
  `~/.gemini`、opencode 软链随包技能。README 已披露、`linkSkills:false` 可关，
  所以评审只算「不影响结论的备注」；**没披露、关不掉的副作用就是打回理由**。

**怎么修的（防复发的做法）**

- 默认值运行时推导：`join(homedir(), ".local/bin/tomato-runtime")`——安装脚本
  （`scripts/install.mjs`）写到哪，默认就从哪个用户的主目录推出，不写死。
- 子进程不再传 `env`，继承宿主环境。DSH 的 `ctx.subprocess.spawn` 不传 `env`
  时会继承 scrub 后的宿主环境（凭据形变量被剥掉，HOME/PATH/代理保留，见
  `@deepseek-ai/dsh-subprocess` 的 `scrubbedParentEnv()`）。
- 装载补丁删掉 `config.tomatoBin`（`EntryOptions.config` 本就可缺省，缺省即走
  插件默认值），只留 `id` + `name`。
- 回归测试三条（`scripts/plugin-host.test.mjs`）：默认路径落在当前用户主目录、
  spawn 不钉 `HOME`、发布文件不出现 `/home/`；live 冒烟不再传 `tomatoBin`。
- 验发布物：`npm pack` 的 tarball、registry 下载的 tarball、GitHub release 的
  plugin tarball 三个都 grep 一遍 `/home/`，全干净才发。

## 发布前检查清单

按顺序过，任何一条不过就不发布：

1. **grep 作者痕迹**（仓库 + 产物）：

   ```sh
   rg -n "/home/|C:\\Users|你的用户名|你的机器名" --glob '!node_modules' --glob '!.git'
   # 打包后拆包再查一遍：
   npm pack --pack-destination /tmp && tar -xzOf /tmp/<pkg>.tgz package/index.js | grep -n "/home/"
   ```

   例外要能说出「为什么」：注释里引用本地路径、测试夹具、演示脚本不算发布物，
   但 `files` 名单里的文件都算。
2. **默认值运行时推导**：`homedir()`、`os.tmpdir()`、XDG 目录、相对路径、
   `import.meta.url`。安装脚本创建的东西，按「安装它的那个用户」解析，
   不按开发者解析。
3. **子进程环境**：默认继承；要覆盖某个变量，先回答「这个值在别人的机器上
   是什么」。答不上来 = 硬编码 bug。
4. **配置/装载补丁不写死**：cordis.patch.yml、preset、install 脚本里的 `config`
   缺省即走插件默认；补丁里写路径等于替用户选了错误答案。
5. **前置依赖摆在明面上**：二进制/服务/守护进程不在包里时，README 与市场描述
   必须写明装什么、怎么启动、监听哪里。市场描述每一句都会被评审拿代码核对——
   数字、命令、端口都要真存在。
6. **副作用披露 + 可关**：往用户目录写东西、软链、改全局配置，必须 README 披露
   并给关闭开关。默认静默改用户机器是打回理由。
7. **回归测试防复发**：把「不出现 `/home/`」「默认值落在 homedir 下」
   「spawn 不钉 HOME」写成断言；live 冒烟不传机器专属配置。测试锁契约，
   评审锁发布，两层都别省。
8. **验发布物，不是仓库**：`npm pack` 的 tarball、registry 下载的 tarball、
   GitHub release 的 tarball，三个都 grep。仓库干净 ≠ 包干净。
9. **别人机器的心智演练**：干净 `$HOME`、另一个账号、容器空用户，走一遍
   安装 → 启动 → 核心功能。作者机器上这套流程永远全绿——这正是它测不出
   bug 的原因。

## 被评审抓到时怎么回（复盘流程）

- **区分「描述能解决」与「必须改代码」**：评审原话「需要修的是代码（这不是
  描述能解决的问题）」——前置说明写得再好，工具全断还是全断。先修代码，
  再补描述。
- **用评审给的文案**：评审给出 en/zh 描述模板时直接采用，复验零扯皮。
- **回评给证据**：commit 号、测试结果、拆包 grep 结果、live 冒烟通过；
  只说「已修」等于没回。
- **版本节奏**：修完发 PATCH（0.14.1），market 索引等 registry 可见新版本再
  同步——`scripts/update-market-index.mjs` 在 npm 未返回当前版本时会失败，
  不要提交旧索引（CONTRIBUTING.md「发布到 npm 与插件市场」）。

## 与其他技能的边界

- 版本号、锁文件、可复现构建 → `versioning-reproducibility`
- 提交信息 / PR 描述怎么写 → `writing-for-readers`
- 发布流水线与 CI 门 → `ci-cd`
- 怎么把「防复发」写成测试 → `testing`
- 给市场/上游提 PR 的礼仪与最小代价 → `contributing-upstream`
