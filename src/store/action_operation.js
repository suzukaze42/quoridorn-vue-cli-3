// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
// import 'bcdice-js/lib/preload-dicebots'
import Vue from "vue";
import Vuex from "vuex";
import {quoridornLog} from "../components/common/Utility";

Vue.use(Vuex);

/**
 * Store
 * @type {Vuex}
 */
export default {
  actions: {
    /** ========================================================================
     * チャットログを追加する
     */
    addChatLog: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doAddChatLog"
      });
    },
    doAddChatLog: ({ dispatch, rootState, rootGetters }, payload) => {
      let text = payload.text;
      if (!text.startsWith("@")) {
        const activeChatTab = rootGetters.activeChatTab;
        const name = payload.name;
        const color = payload.color;
        const tab = payload.tab ? payload.tab : activeChatTab.name;
        const from = payload.from;
        const target = payload.target;
        let viewHtml;
        if (target) {
          const targetName = rootGetters.getObj(target).name;
          viewHtml = `<span style="color: ${color};"><b>${name} > ${targetName}</b>：${text.replace(
            /\r?\n/g,
            "<br>"
          )}</span>`;
        } else {
          viewHtml = `<span style="color: ${color};"><b>${name}</b>：${text.replace(
            /\r?\n/g,
            "<br>"
          )}</span>`;
        }
        const logObj = {
          owner: payload.owner,
          target: target,
          from: from,
          viewHtml: viewHtml
        };
        // 未読カウントアップ
        if (tab !== activeChatTab.name) {
          const tabObj = rootState.public.chat.tabs.filter(
            tabObj => tabObj.name === tab
          )[0];
          tabObj.unRead++;
          const index = rootState.public.chat.tabs.indexOf(tabObj);
          rootState.public.chat.tabs.splice(index, 1, tabObj);
        }
        rootState.public.chat.logs[tab].push(logObj);
      }

      // チャット文字連携処理
      dispatch("chatLinkage", text);
    },
    /** ========================================================================
     * チャット文字色変更
     */
    changeChatFontColor: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doChangeChatFontColor"
      });
    },
    doChangeChatFontColor: (
      { dispatch, rootState, rootGetters },
      { key, color, historyChange }
    ) => {
      window.console.log("doChangeChatFontColor", key, color, historyChange);
      const kind = key.split("-")[0];
      const target = rootState.public[kind].list.filter(
        obj => obj.key === key
      )[0];
      window.console.log(target, rootState.public[kind]);
      if (!target) return;
      target.fontColor = color;
      if (!historyChange) return;
      const change = {};
      for (const tab in rootState.public.chat.logs) {
        if (!rootState.public.chat.logs.hasOwnProperty(tab)) continue;
        const changeTab = {};
        change[tab] = changeTab;
        rootState.public.chat.logs[tab].forEach((log, index) => {
          window.console.log(
            "chatLogs",
            tab,
            log.owner,
            target.key,
            log.owner !== target.key,
            log.viewHtml
          );
          if (log.owner !== target.key) return;
          window.console.log("push");
          changeTab[index] = {
            viewHtml: log.viewHtml.replace(
              /^(<span style="color: )([^;]+)(;">)/,
              `$1${color}$3`
            )
          };
        });
      }
      dispatch("setProperty", {
        property: `public.chat.logs`,
        value: change,
        isNotice: false,
        logOff: false
      });
    },
    /** ========================================================================
     * チャット文字連携処理
     */
    chatLinkage: ({ dispatch, rootState, rootGetters }, text) => {
      rootState.setting.bgm.list
        .filter(bgmObj => {
          if (
            bgmObj.chatLinkage === 1 &&
            text.endsWith(bgmObj.chatLinkageSearch)
          ) {
            return true;
          }
          return (
            bgmObj.chatLinkage === 2 &&
            new RegExp(bgmObj.chatLinkageSearch).test(text)
          );
        })
        .sort((a, b) => {
          if (a.title.length > b.title.length) return -1;
          if (a.title.length < b.title.length) return 1;
          return 0;
        })
        .filter(
          (bgmObj, index, self) =>
            self.filter((s, i) => index > i && s.tag === bgmObj.tag).length ===
            0
        )
        .forEach(bgmObj => {
          dispatch("setProperty", {
            property: "private.display.jukeboxWindow.command",
            isNotice: true,
            value: { command: "add", payload: bgmObj.key }
          });
        });
    },
    /** ========================================================================
     * 画像を追加する
     */
    addImage: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", { value: payload, method: "doAddImage" });
    },
    doAddImage: ({ rootState }, { tag, data, ownerPeerId }) => {
      // 欠番を埋める方式は不採用
      let maxKey = rootState.public.image.maxKey;
      const key = `image-${++maxKey}`;
      rootState.public.image.maxKey = maxKey;
      rootState.public.image.list.push({
        tag: tag,
        data: data,
        key: key
      });
      if (rootState.private.self.peerId === ownerPeerId) {
        rootState.private.history.push({ type: "add", key: key });
      }
    },
    /** ========================================================================
     * 名前を変更する
     */
    changeName: ({ dispatch, rootState }, name) => {
      dispatch("setProperty", {
        property: "private.self.currentChatName",
        value: name,
        logOff: false
      });
      // const myPeerId = rootState.private.self.peerId
      // const members = rootState.public.room.members
      // const myMemberObjList = members.filter(memberObj => memberObj.peerId === myPeerId)
      // if (myMemberObjList.length > 0) {
      //   const memberObj = myMemberObjList[0]
      //   const index = members.indexOf(memberObj)
      //   dispatch('setProperty', {property: `public.room.members.${index}.name`, value: name, logOff: true})
      //   dispatch('sendRoomData', { type: 'CHANGE_PLAYER_NAME', value: name })
      // }
    },
    /** ========================================================================
     * BGMを追加する
     */
    addBGM: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", { value: payload, method: "doAddBGM" });
    },
    doAddBGM: ({ rootState }, payload) => {
      // 欠番を埋める方式は不採用
      let maxKey = rootState.setting.bgm.maxKey;
      const key = `bgm-${++maxKey}`;
      rootState.setting.bgm.maxKey = maxKey;
      payload.key = key;
      rootState.setting.bgm.list.push(payload);
    },
    /** ========================================================================
     * マップオブジェクトを追加する
     */
    addPieceInfo: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doAddPieceInfo"
      });
    },
    doAddPieceInfo: ({ rootState }, payload) => {
      const obj = {
        isDraggingLeft: false,
        move: {
          from: { x: 0, y: 0 },
          dragging: { x: 0, y: 0 },
          gridOffset: { x: 0, y: 0 }
        },
        angle: {
          total: 0,
          dragging: 0,
          dragStart: 0
        },
        isLock: false
      };
      for (let prop in payload) {
        if (!payload.hasOwnProperty(prop)) continue;
        obj[prop] = payload[prop];
      }

      // 欠番を埋める方式は不採用
      let maxKey = rootState.public[payload.propName].maxKey;
      const key = `${payload.kind}-${++maxKey}`;
      obj.key = key;
      rootState.public[payload.propName].maxKey = maxKey;

      quoridornLog(
        `[mutations] doAddPieceInfo => {type: ${obj.type}, key:${
          obj.key
        }, name:"${obj.name}", locate:(${obj.top}, ${obj.left}), CsRs:(${
          obj.columns
        }, ${obj.rows}), bg:"${obj.color}", font:"${obj.fontColor}"}`
      );

      rootState.public[payload.propName].list.push(obj);
      if (rootState.private.self.peerId === payload.ownerPeerId) {
        rootState.private.history.push({ type: "add", key: key });
      }
    },
    /** ========================================================================
     * マップオブジェクト情報を変更する
     */
    changePieceInfo: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doChangePieceInfo"
      });
    },
    doChangePieceInfo: ({ rootState, rootGetters }, payload) => {
      const key = payload.key;
      const propName = payload.propName;

      const pieceObj = rootGetters.getPieceObj(propName, key);
      for (let prop in payload) {
        if (!payload.hasOwnProperty(prop)) continue;
        if (prop === "key" || prop === "propName") {
          continue;
        }
        if (pieceObj[prop] !== payload[prop]) {
          quoridornLog(
            `[mutations] update ${propName}(${key}) => ${prop}: ${
              pieceObj[prop]
            } -> ${payload[prop]}`
          );
          pieceObj[prop] = payload[prop];
        }
      }
      const index = rootState.public[propName].list.indexOf(pieceObj);
      rootState.public[propName].list.splice(index, 1, pieceObj);
    },
    /** ========================================================================
     * マップオブジェクトの削除
     */
    deletePieceInfo: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doDeletePieceInfo"
      });
    },
    doDeletePieceInfo: ({ rootState, rootGetters }, payload) => {
      // quoridornLog(`delete pieceInfo -> ${payload.propName}(${payload.key})`)
      const obj = rootGetters.getPieceObj(payload.propName, payload.key);
      const index = rootState.public[payload.propName].list.indexOf(obj);
      rootState.public[payload.propName].list.splice(index, 1);

      if (rootState.private.self.peerId === payload.ownerPeerId) {
        rootState.private.history.splice(
          rootState.private.history.findIndex(
            hisObj => hisObj.key === payload.key
          ),
          1
        );
      }
    },
    /** ========================================================================
     * デッキのシャッフル
     */
    shuffleDeck: ({ dispatch }) => {
      dispatch("sendNoticeOperation", { value: {}, method: "doShuffleDeck" });
    },
    doShuffleDeck: ({ rootState }) => {
      const cardList = rootState.public.deck.cards.list.concat();
      for (let i = cardList.length - 1; i >= 0; i--) {
        // 0~iのランダムな数値を取得
        const rand = Math.floor(Math.random() * (i + 1));

        // [cardList[i], cardList[rand]] = [cardList[rand], cardList[i]]
        const tmp = cardList[i];
        cardList[i] = cardList[rand];
        cardList[rand] = tmp;
        // cardList.splice(i, 1, cardList[rand])
        // cardList.splice(rand, 1, tmp)
      }
      rootState.public.deck.cards.list = cardList;
      // cardList.splice(0, 1, cardList[0])
    },
    /** ========================================================================
     * カードのドロー
     */
    drawCard: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", { value: payload, method: "doDrawCard" });
    },
    doDrawCard: ({ rootState, rootGetters }, payload) => {
      const index = payload.index;
      // const cardKey = payload.key

      const cardList = rootState.public.deck.cards.list;
      const card = cardList[index];
      cardList.splice(index, 1);

      // TODO 手札に加える処理
      rootState.private.self.cards.push(card);

      // const obj = rootGetters.getPieceObj(payload.propName, payload.key)
      // const index = rootState.public[payload.propName].list.indexOf(obj)
      // rootState.public[payload.propName].list.splice(index, 1)
      //
      // if (rootState.private.self.peerId === payload.ownerPeerId) {
      //   const delHistoryObj = rootState.private.history.filter(hisObj => hisObj.key === payload.key)[0]
      //   const delHistoryIndex = rootState.private.history.indexOf(delHistoryObj)
      //   rootState.private.history.splice(delHistoryIndex, 1)
      // }
    },
    /** ========================================================================
     * グループチャットの追加
     */
    addGroupTargetTab: ({ dispatch }, payload) => {
      dispatch("sendNoticeOperation", {
        value: payload,
        method: "doAddGroupTargetTab"
      });
    },
    doAddGroupTargetTab: ({ rootState }, payload) => {
      const addObj = {
        key: `groupTargetTab-${++rootState.public.chat.groupTargetTab.maxKey}`,
        isSecret: false,
        name: "",
        targetTab: null,
        isAll: false,
        group: [payload.ownerKey]
      };
      rootState.public.chat.groupTargetTab.list.push(addObj);
    }
  },
  getters: {
    chatLogList: (state, getters, rootState) => {
      return rootState.public.chat.logs[rootState.chat.activeTab].filter(
          log => {
            if (log.from === getters.selfPlayerKey) return true;
            if (!log.target) return true;
            if (log.target === "groupTargetTab-0") return true;
            const kind = log.target.split("-")[0];
            if (kind === "groupTargetTab") {
              const target = getters.getObj(log.target);
              if (!target.isSecret) return true;
              if (target.isAll) return true;
              const findIndex = target.group.findIndex(g => {
                const kind = g.split("-")[0];
                if (kind === "player") {
                  if (g === getters.selfPlayerKey) return true;
                } else if (kind === "character") {
                  if (getters.getObj(g).owner === getters.selfPlayerKey)
                    return true;
                }
                return false;
              });
              return findIndex > -1;
            } else if (kind === "player") {
              window.console.log(
                  "-----player",
                  log.target,
                  getters.selfPlayerKey,
                  log.target === getters.selfPlayerKey
              );
              return log.target === getters.selfPlayerKey;
            } else {
              const target = getters.getObj(log.target);
              return target.owner === getters.selfPlayerKey;
            }
          }
      );
    },
    chatTabList: (state, getters, rootState) => rootState.public.chat.tabs,
    playerList: (state, getters, rootState) => rootState.public.player.list,
    characterList: (state, getters, rootState) =>
        rootState.public.character.list,
    groupTargetTabList: (state, getters, rootState) => {
      return rootState.public.chat.groupTargetTab.list.filter(tab => {
        if (tab.isAll) return true;
        const filterObj = tab.group.filter(targetKey => {
          if (targetKey === getters.currentActorKey) return true;
          if (getters.currentActorKey.split("-")[0] === "player") {
            const targetCharacter = getters.characterList
                .filter(character => character.owner === getters.currentActorKey)
                .filter(character => character.key === targetKey)[0];
            if (targetCharacter) return true;
          } else if (getters.currentActorKey.split("-")[0] === "character") {
            const targetCharacter = getters.characterList.filter(
                character => character.key === getters.currentActorKey
            )[0];
            if (targetCharacter) return true;
          }
          return false;
        });
        if (filterObj.length > 0) return true;
      });
    },
    members: (state, getters, rootState) =>
        rootState.public.room.members.filter(member => {
          return member.peerId !== rootState.private.self.peerId;
        }),
    currentCount: (state, getters, rootState) => rootState.count,
    currentChatName: (state, getters, rootState) =>
        rootState.private.self.currentChatName,
    inputting: (state, getters, rootState) => rootState.public.chat.inputting,
    createInputtingMsg: (state, getters, rootState) => {
      return function (name) {
        return `${name}が入力中...`;
      };
    },
    fontColor: (state, getters, rootState) => rootState.private.self.color,
    chatTargetList: (state, getters, rootState) => {
      const list = [
        ...getters.groupTargetTabList,
        ...getters.playerList,
        ...getters.characterList.filter(
            character => character.place === "field"
        )
      ];
      return list;
    },
    activeTab: (state, getters, rootState) => rootState.chat.activeTab,
    hoverTab: (state, getters, rootState) => rootState.chat.hoverTab,
    selfPlayerKey: (state, getters, rootState) => {
      const player = rootState.public.player.list.filter(
          player => player.name === rootState.private.self.playerName
      )[0];
      return player ? player.key : null;
    },
    chatOptionPageNum: (state, getters, rootState) => {
      if (getters.chatOptionSelectMode === "from") {
        const index = getters.getPeerActors.findIndex(
            target => target.key === getters.chatTarget
        );
        if (index === -1) return -1;
        return Math.floor(index / getters.chatOptionPagingSize) + 1;
      }
      if (getters.chatOptionSelectMode === "target") {
        const index = getters.chatTargetList.findIndex(
            target => target.key === getters.chatTarget
        );
        if (index === -1) return -1;
        return Math.floor(index / getters.chatOptionPagingSize) + 1;
      }
      if (getters.chatOptionSelectMode === "tab") {
        const index = getters.chatTabList.findIndex(
            target => target.name === getters.activeTab
        );
        if (index === -1) return -1;
        return Math.floor(index / getters.chatOptionPagingSize) + 1;
      }
      return -1;
    },
    chatOptionPageMaxNum: (state, getters, rootState) => {
      if (getters.chatOptionSelectMode === "from") {
        return (
            Math.floor(
                getters.getPeerActors.length / getters.chatOptionPagingSize
            ) + 1
        );
      }
      if (getters.chatOptionSelectMode === "target") {
        return (
            Math.floor(
                getters.chatTargetList.length / getters.chatOptionPagingSize
            ) + 1
        );
      }
      if (getters.chatOptionSelectMode === "tab") {
        return (
            Math.floor(
                getters.chatTabList.length / getters.chatOptionPagingSize
            ) + 1
        );
      }
      return 0;
    },
    chatOptionPagingList: (state, getters, rootState) => {
      const pageNum = getters.chatOptionPageNum;
      const startIndex = (pageNum - 1) * getters.chatOptionPagingSize;
      if (getters.chatOptionSelectMode === "from") {
        const endIndex = Math.min(
            pageNum * getters.chatOptionPagingSize,
            getters.getPeerActors.length
        );
        const result = getters.getPeerActors.concat();
        return result.splice(startIndex, endIndex - startIndex);
      }
      if (getters.chatOptionSelectMode === "target") {
        const endIndex = Math.min(
            pageNum * getters.chatOptionPagingSize,
            getters.chatTargetList.length
        );
        const result = getters.chatTargetList.concat();
        return result.splice(startIndex, endIndex - startIndex);
      }
      if (getters.chatOptionSelectMode === "tab") {
        const endIndex = Math.min(
            pageNum * getters.chatOptionPagingSize,
            getters.chatTabList.length
        );
        const result = getters.chatTabList.concat();
        return result.splice(startIndex, endIndex - startIndex);
      }
      return 0;
    }
  }
};
