<template>
  <window-frame
    titleText="チャット"
    display-property="private.display.chatWindow"
    align="left-bottom"
    baseSize="-300, 260"
    :fontSizeBar="true"
  >
    <div class="container">
      <!----------------
       ! タブ
       !--------------->
      <div class="tabs dep" @contextmenu.prevent>
        <!-- タブ -->
        <span
          class="tab"
          v-for="(tabObj, index) in chatTabs"
          :key="tabObj.name"
          :class="{ active: tabObj.key === activeTab, unRead: tabObj.unRead > 0 }"
          @mousedown.prevent="chatTabOnSelect(tabObj.key)"
          :tabindex="index + 1"
        >#{{tabObj.name}}/{{tabObj.unRead}}</span>

        <!-- タブ設定ボタン -->
        <span
          class="tab addButton"
          @click="tabAddButtonOnClick"
          :tabindex="chatTabs.length + 1"
        ><span class="icon-cog"></span></span>
      </div>

      <!----------------
       ! チャットログ
       !--------------->
      <ul id="chatLog" class="selectable" @wheel.stop>
        <li v-for="(chatLog, index) in chatLogList" v-html="chatLog.viewHtml" :key="index"></li>
      </ul>

      <!----------------
       ! 操作盤
       !--------------->
      <label class="oneLine dep" @contextmenu.prevent>

        <!-- 発言者選択 -->
        <span class="label">名前(！)</span>
        <select
          :tabindex="chatTabs.length + 2"
          :value="chatActorKey"
          @change="event => updateActorKey(event.target.value)" title=""
        >
          <option
            v-for="actor in getSelfActors"
            :key="actor.key"
            :value="actor.key"
          >{{getViewName(actor.key)}}</option>
        </select>

        <!-- ステータス選択 -->
        <actor-status-select :actorKey="chatActorKey" v-model="statusName" :tabindex="chatTabs.length + 3"/>

        <!-- ダイスボット選択 -->
        <dice-bot-select ref="diceBot" v-model="currentDiceBotSystem" :tabindex="chatTabs.length + 4" class="diceBotSystem"/>

        <!-- ここから各種機能呼び出しボタン -->
        <span class="icon">
          <i
            class="icon-dice"
            title="ダイスボットの追加・編集・削除"
            @click="diceBotSettingButtonOnClick"
            :tabindex="chatTabs.length + 5"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-bin"
            title="チャットログ全削除"
            @click="chatLogDeleteButtonOnClick"
            :tabindex="chatTabs.length + 6"
          ></i>
        </span>
        <!--<span class="icon"><i class="icon-font" title="フォントの設定" @click="chatFontSettingButtonOnClick" :tabindex="chatTabs.length + 9"></i></span>-->
        <span class="icon">
          <i
            class="icon-cloud-check"
            title="点呼・投票設定"
            @click="rollCallSettingButtonOnClick"
            :tabindex="chatTabs.length + 7"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-bell"
            title="目覚ましアラーム設定"
            @click="alermSettingButtonOnClick"
            :tabindex="chatTabs.length + 8"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-music"
            title="BGMの設定"
            @click="bgmSettingButtonOnClick"
            :tabindex="chatTabs.length + 9"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-film"
            title="カットイン設定"
            @click="cutInSettingButtonOnClick"
            :tabindex="chatTabs.length + 10"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-list2"
            title="チャットパレット設定"
            @click="chatPaletteSettingButtonOnClick"
            :tabindex="chatTabs.length + 11"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-accessibility"
            title="立ち絵設定"
            @click="standImageSettingButtonOnClick"
            :tabindex="chatTabs.length + 12"
          ></i>
        </span>
        <span class="icon">
          <i
            class="icon-target"
            title="射界設定"
            @click="rangeSettingButtonOnClick"
            :tabindex="chatTabs.length + 13"
          ></i>
        </span>
      </label>

      <!----------------
       ! 発言
       !--------------->
      <div class="sendLine dep">
        <div class="textAreaContainer">
          <!----------------
           ! グループチャットタブ
           !--------------->
          <div class="tabs" @contextmenu.prevent>

            <!-- グループチャットタブ -->
            <span
              class="tab"
              v-for="(tabObj, index) in groupTargetTabList"
              :key="tabObj.key"
              :class="{ active: tabObj.key === chatTarget }"
              @mousedown.prevent="groupTargetTabOnSelect(tabObj.key)"
              :tabindex="chatTabs.length + 14 + index"
            >&gt; {{tabObj.name}}{{otherMatcherObj(tabObj) ? `(${getViewName(otherMatcherObj(tabObj).key)})` : ''}}</span>

            <!-- グループチャットタブ編集ボタン -->
            <span
              class="tab addButton"
              @click="targetTabAddButtonOnClick"
              :tabindex="chatTabs.length + chatTabs.length + 14"
            ><span class="icon-cog"></span></span>

            <!-- 「」付与チェックボックス -->
            <label class="bracketOption">
              <input type="checkbox" v-model="addBrackets" :tabindex="chatTabs.length + chatTabs.length + 15" />
              発言時に「」を付与
            </label>

          </div>

          <!----------------
           ! チャットオプション（送信者）
           !--------------->
          <div class="chatOptionSelector dep" v-if="chatOptionSelectMode === 'from'" @contextmenu.prevent>
            <span>送信者{{chatOptionPageMaxNum > 1 ? ` (${chatOptionPageNum} / ${chatOptionPageMaxNum})` : ''}}</span>
            <ul>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === 1">[末尾へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== 1">[前へ]</li>
              <li v-for="actor in chatOptionPagingList"
                  :key="actor.name"
                  :class="{selected: actor.key === chatActorKey && actor.statusName === statusName}"
                  tabindex="-1"
              >{{actor.name}}</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== chatOptionPageMaxNum">[次へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === chatOptionPageMaxNum">[先頭へ]</li>
            </ul>
          </div>

          <!----------------
           ! チャットオプション（対象）
           !--------------->
          <div class="chatOptionSelector dep" v-if="chatOptionSelectMode === 'target'" @contextmenu.prevent>
            <span>送信先{{chatOptionPageMaxNum > 1 ? ` (${chatOptionPageNum} / ${chatOptionPageMaxNum})` : ''}}</span>
            <ul>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === 1">[末尾へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== 1">[前へ]</li>
              <li v-for="target in chatOptionPagingList"
                  :key="target.key"
                  :class="{selected: chatTarget === target.key}"
                  tabindex="-1"
              >{{getViewName(target.key)}}</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== chatOptionPageMaxNum">[次へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === chatOptionPageMaxNum">[先頭へ]</li>
            </ul>
          </div>

          <!----------------
           ! チャットオプション（タブ）
           !--------------->
          <div class="chatOptionSelector dep" v-if="chatOptionSelectMode === 'tab'" @contextmenu.prevent>
            <span>出力先のタブ{{chatOptionPageMaxNum > 1 ? ` (${chatOptionPageNum} / ${chatOptionPageMaxNum})` : ''}}</span>
            <ul>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === 1">[末尾へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== 1">[前へ]</li>
              <li
                v-for="tab in chatOptionPagingList"
                :key="tab.key"
                :class="{selected: outputTab === tab.key}"
                tabindex="-1"
              >{{tab.name}}</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum !== chatOptionPageMaxNum">[次へ]</li>
              <li class="ope" v-if="chatOptionPageMaxNum > 1 && chatOptionPageNum === chatOptionPageMaxNum">[先頭へ]</li>
            </ul>
          </div>

          <!-- チャット入力エリア -->
          <label class="chatInputArea">
            <span class="chatOption" @click="chatOptionOnClick" @contextmenu.prevent>
              <span class="emphasis">! {{getViewName(chatActorKey)}}-{{statusName}}</span>
              <span :class="{emphasis: chatTarget !== 'groupTargetTab-0'}">> {{groupTargetName}}</span>
              <span :class="{emphasis: outputTab !== null}"># {{outputTab ? getTabName(outputTab) : "[選択中]"}}</span>
            </span>
            <!----------------
             ! 入力欄
             !--------------->
            <textarea
              id="chatTextArea"
              v-model="currentMessage"
              @input="onInput"
              @blur="textAreaOnBlur"
              @keydown.up="event => chatOptionSelectChange('up', event)"
              @keydown.down="event => chatOptionSelectChange('down', event)"
              @keydown.esc.prevent="textAreaOnPressEsc"
              @keypress.enter.prevent="event => sendMessage(event, true)"
              @keyup.enter.prevent="event => sendMessage(event, false)"
              :tabindex="chatTabs.length + chatTabs.length + 16"
              :placeholder="'メッセージ（改行はShift + Enter）'"
            ></textarea>
          </label>
        </div>
        <button :tabindex="chatTabs.length + chatTabs.length + 17" @contextmenu.prevent>送信</button>
      </div>
      <!----------------
       ! 入力者表示
       !--------------->
      <div class="inputtingArea dep" @contextmenu.prevent>
        <div
          v-for="name in inputtingPeerIdList"
          :key="name"
        >
          <img
            alt=""
            v-show="inputtingPeerIdList.length>0"
            :src="require('../../assets/inputting.gif')"
          >
          {{createInputtingMsg(name)}}
        </div>
      </div>
    </div>
  </window-frame>
</template>

<script lang="ts">
import DiceBotSelect from "../parts/select/DiceBotSelect.vue";
import ActorStatusSelect from "@/components/parts/select/ActorStatusSelect.vue";

import WindowMixin from "../WindowMixin.vue";
import WindowFrame from "../WindowFrame.vue";

import { Vue, Watch } from "vue-property-decorator";
import { Action, Getter, Mutation } from "vuex-class";
import { Component, Mixins } from "vue-mixin-decorator";

@Component({
  components: {
    ActorStatusSelect,
    WindowFrame,
    DiceBotSelect
  }
})
export default class ChatWindow extends Mixins<WindowMixin>(WindowMixin) {
  @Action("addChatLog") private addChatLog: any;
  @Action("chatTabSelect") private chatTabSelect: any;
  @Action("windowOpen") private windowOpen: any;
  @Action("setProperty") private setProperty: any;
  @Action("sendRoomData") private sendRoomData: any;
  @Action("sendBcdiceServer") private sendBcdiceServer: any;
  @Mutation("updateActorKey") private updateActorKey: any;
  @Mutation("addSecretDice") private addSecretDice: any;
  @Getter("getSelfActors") private getSelfActors: any;
  @Getter("getViewName") private getViewName: any;
  @Getter("getObj") private getObj: any;
  @Getter("chatLogList") private chatLogList: any;
  @Getter("chatTabs") private chatTabs: any;
  @Getter("playerList") private playerList: any;
  @Getter("groupTargetTabList") private groupTargetTabList: any;
  @Getter("members") private members: any;
  @Getter("inputting") private inputting: any;
  @Getter("createInputtingMsg") private createInputtingMsg: any;
  @Getter("fontColor") private fontColor: any;
  @Getter("chatTargetList") private chatTargetList: any;
  @Getter("activeTab") private activeTab: any;
  @Getter("hoverTab") private hoverTab: any;
  @Getter("playerKey") private playerKey: any;
  @Getter("chatOptionPagingSize") private chatOptionPagingSize: any;
  @Getter("isWait") private isWait: any;
  @Getter("chatActorKey") private chatActorKey: any;
  @Getter("roomSystem") private roomSystem: any;
  @Getter("getChatColor") private getChatColor: any;
  @Getter("getOwnerKey") private getOwnerKey: any;

  /** Enterを押しているかどうか */
  private enterPressing: boolean = false;
  /** 入力されたチャット文字 */
  private currentMessage: string = "";
  /** 発言時に「」を付与するかどうか */
  private addBrackets: boolean = false;
  /** チャットオプション入力モード('tab':# or 'target':@ or '') */
  private chatOptionSelectMode: string = "";
  /** 発言先 */
  private chatTarget: string = "groupTargetTab-0";
  /** 出力先のタブ */
  private outputTab: string | null = null;
  /** 選択されているシステム */
  private currentDiceBotSystem: string = "DiceBot";
  /** 秘匿チャットの相手 */
  private secretTarget: string = "";
  /** 入力中のルームメンバーのpeerIdの配列 */
  private inputtingPeerIdList: any[] = [];

  private volatileFrom: string = "";
  private volatileStatusName: string = "";
  private volatileTarget: string = "";
  private volatileActiveTab: string = "";
  private volatileTargetTab: string | null = "";
  private statusName: string = "◆";

  /**
   * チャット入力欄の入力イベントハンドラ
   * @param event イベント
   */
  private onInput(event: any): void {
    const text = event.target.value;

    let selectFrom: string = "";
    if (text.startsWith("!") || text.startsWith("！")) {
      const useText = text.substring(1);
      if (useText.length === 0) {
        selectFrom = this.chatActorKey;
      }
      this.getSelfActors.forEach((target: any) => {
        if (selectFrom) return;
        if (this.getViewName(target.key).startsWith(useText)) {
          selectFrom = target.key;
        }
      });
    }

    let selectTarget: string = "";
    if (text.startsWith(">") || text.startsWith("＞")) {
      const useText = text.substring(1);
      if (useText.length === 0) {
        selectTarget = this.chatTarget;
      }
      this.chatTargetList.forEach((target: any) => {
        if (selectTarget) return;
        if (target.name.startsWith(useText)) {
          selectTarget = target.key;
        }
      });
    }

    let selectTab: string | null | undefined = undefined;
    if (text.startsWith("#") || text.startsWith("＃")) {
      const useText = text.substring(1);
      if (useText.length === 0) {
        selectTab = this.outputTab;
      }
      const selection: any[] = [
        { name: "[選択中]", key: null },
        ...this.chatTabs
      ];
      selection.forEach(({ key, name }: { key: string; name: string }) => {
        if (selectTab !== undefined) return;
        if (name.startsWith(useText)) selectTab = key;
      });
    }

    if (selectFrom) {
      this.chatOptionSelectMode = "from";
      this.updateActorKey(selectFrom);
    } else if (selectTarget) {
      this.chatOptionSelectMode = "target";
      this.chatTarget = selectTarget;
    } else if (selectTab !== undefined) {
      this.chatOptionSelectMode = "tab";
      this.outputTab = selectTab;
    } else {
      this.chatOptionSelectMode = "";
      this.sendRoomData({
        type: "NOTICE_INPUT",
        value: { key: this.chatActorKey, target: this.chatTarget },
        isWait: this.isWait
      });
    }
  }

  /**
   * 現在のチャット送信対象
   */
  private get groupTargetName(): string | null {
    let target = this.getObj(this.chatTarget);
    return target ? this.getViewName(target.key) : null;
  }

  /**
   * 上下キーを押下されてチャットオプションの選択項目を移動させる処理
   */
  private chatOptionSelectChange(direction: string, event: any): void {
    // 変化前の値を保存
    if (!this.volatileFrom) this.volatileFrom = this.chatActorKey;
    if (!this.volatileStatusName) this.volatileStatusName = this.statusName;
    if (!this.volatileTarget) this.volatileTarget = this.chatTarget;
    if (!this.volatileActiveTab) this.volatileActiveTab = this.activeTab;
    if (!this.volatileTargetTab) this.volatileTargetTab = this.outputTab;

    // カーソル移動と、移動後の輪転処理
    const arrangeIndex = (list: any[], index: number) => {
      index += direction === "up" ? -1 : 1;
      if (index < 0) index = list.length - 1;
      if (index === list.length) index = 0;
      return list[index];
    };

    // 発言者の選択の場合
    if (this.chatOptionSelectMode === "from") {
      event.preventDefault();
      let index = this.useCommandActorList.findIndex(
        (s: any) =>
          s.key === this.chatActorKey && s.statusName === this.statusName
      );
      const newValue = arrangeIndex(this.useCommandActorList, index);

      this.updateActorKey(newValue.key);
      this.statusName = newValue.statusName;
    }

    // 発言先の選択の場合
    if (this.chatOptionSelectMode === "target") {
      event.preventDefault();
      let index = this.chatTargetList.findIndex(
        (s: any) => s.key === this.chatTarget
      );
      const newValue = arrangeIndex(this.chatTargetList, index);

      this.groupTargetTabOnSelect(newValue.key);
    }

    // タブの選択の場合
    if (this.chatOptionSelectMode === "tab") {
      const selection: (null | any)[] = [
        null, // [選択中]
        ...this.chatTabs.map((tab: any) => tab.key)
      ];

      event.preventDefault();
      let index = selection.indexOf(this.outputTab);
      const newValue = arrangeIndex(selection, index);

      this.chatTabOnSelect(
        newValue !== null ? newValue : this.volatileActiveTab
      );
      this.outputTab = newValue;
    }
  }

  /**
   * 入力欄からフォーカスが外れた場合
   */
  private textAreaOnBlur(): void {
    this.resetChatOption();
  }

  /**
   * 入力欄でESCキーを押下した場合
   */
  private textAreaOnPressEsc(): void {
    this.resetChatOption();
  }

  /**
   * チャットオプションを仮変更前の状態に戻す
   */
  private resetChatOption(): void {
    if (this.chatOptionSelectMode) {
      this.currentMessage = "";
      if (this.volatileFrom) {
        this.updateActorKey(this.volatileFrom);
      }
      if (this.volatileStatusName) this.statusName = this.volatileStatusName;
      if (this.volatileTarget) this.chatTarget = this.volatileTarget;
      if (this.volatileActiveTab) this.chatTabOnSelect(this.volatileActiveTab);
      if (this.volatileTargetTab) this.outputTab = this.volatileTargetTab;
    }
    this.chatOptionSelectMode = "";
    this.volatileFrom = "";
    this.volatileTarget = "";
    this.volatileStatusName = "";
    this.volatileActiveTab = "";
    this.volatileTargetTab = "";
  }

  /**
   * チャットログ表示タブを選択されたときの挙動
   * @param key タブのkey
   */
  private chatTabOnSelect(key: string): void {
    this.setProperty({
      property: "chat.activeTab",
      value: key,
      logOff: true
    });
    this.chatTabSelect(key);
  }

  /**
   * グループターゲットタブを選択された時の挙動
   * @param targetKey タブのkey
   */
  private groupTargetTabOnSelect(targetKey: string): void {
    this.chatTarget = targetKey;

    if (targetKey.split("-")[0] === "groupTargetTab") {
      const tabObj = this.getObj(this.chatTarget);
      if (tabObj.targetTab) this.outputTab = tabObj.targetTab;
      const otherObj: any = this.otherMatcherObj(tabObj);
      if (otherObj) {
        this.updateActorKey(otherObj.key);
      }
    }
  }

  /**
   * チャットオプションクリックイベントハンドラ
   */
  private chatOptionOnClick(): void {
    document.getElementById("chatTextArea")!.focus();
  }

  /**
   * チャットタブ追加ボタンクリックイベントハンドラ
   */
  private tabAddButtonOnClick(): void {
    this.windowOpen("private.display.settingChatTabWindow");
  }

  /**
   * グループチャットタグ追加ボタンクリックイベントハンドラ
   */
  private targetTabAddButtonOnClick(): void {
    this.windowOpen("private.display.settingChatTargetTabWindow");
  }

  /**
   * ダイスボット管理ボタンクリックイベントハンドラ
   */
  private diceBotSettingButtonOnClick(): void {
    this.setProperty({
      property: "private.display.unSupportWindow.title",
      value: "ダイスボット用表管理",
      logOff: true
    });
    this.windowOpen("private.display.unSupportWindow");
  }

  /**
   * チャットログ削除ボタンクリックイベントハンドラ
   */
  private chatLogDeleteButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * グループチャットタグ追加ボタンクリックイベントハンドラ
   */
  private chatFontSettingButtonOnClick(): void {
    this.windowOpen("private.display.settingChatFontWindow");
  }

  /**
   * 点呼・投票設定ボタンクリックイベントハンドラ
   */
  private rollCallSettingButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * 目覚ましアラーム設定ボタンクリックイベントハンドラ
   */
  private alermSettingButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * BGM設定ボタンクリックイベントハンドラ
   */
  private bgmSettingButtonOnClick(): void {
    this.windowOpen("private.display.settingBGMWindow");
  }

  /**
   * カットイン設定ボタンクリックイベントハンドラ
   */
  private cutInSettingButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * チャットパレット設定ボタンクリックイベントハンドラ
   */
  private chatPaletteSettingButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * 立ち絵設定ボタンクリックイベントハンドラ
   */
  private standImageSettingButtonOnClick(): void {
    this.windowOpen("private.display.standImageSettingWindow");
  }

  /**
   * 射界設定ボタンクリックイベントハンドラ
   */
  private rangeSettingButtonOnClick(): void {
    // TODO
    alert("未実装です。");
  }

  /**
   * チャットオプションに表示するチャットタブの表示名の取得
   * @param tabKey
   */
  private getTabName(tabKey: string): string {
    const tab = this.chatTabs.filter((tab: any) => tab.key === tabKey)[0];
    return tab ? tab.name : null;
  }

  /**
   * チャット欄に記入された内容をチャットに反映させる
   * @param event イベント
   * @param flg 押下ならtrue, 離す場合はfalse
   */
  private sendMessage(this: any, event: any, flg: boolean): void {
    if (this.enterPressing === flg) return;
    this.enterPressing = flg;
    if (!flg) return;
    if (event.shiftKey) {
      this.currentMessage += "\r\n";
      return;
    }
    if (this.currentMessage === "") return;

    // チャット送信オプション選択中のEnterは特別仕様
    if (this.chatOptionSelectMode) {
      if (this.chatOptionSelectMode) this.currentMessage = "";
      this.chatOptionSelectMode = "";
      this.volatileFrom = "";
      this.volatileStatusName = "";
      this.volatileTarget = "";
      this.volatileActiveTab = "";
      this.volatileTargetTab = "";
      return;
    }

    // 文字色決定
    const color = this.getChatColor(this.chatActorKey);

    // 括弧をつけるオプション
    let text = this.currentMessage;
    if (this.addBrackets) {
      text = `「${text}」`;
    }

    // 出力先タブ決定
    let outputTab = this.outputTab;
    if (outputTab === null) {
      outputTab = this.activeTab;
    }

    let ownerKey: string | undefined = this.getOwnerKey(this.chatActorKey);

    // -------------------
    // ダイスBot処理
    // -------------------
    this.sendBcdiceServer({
      system: this.currentDiceBotSystem,
      command: this.currentMessage
    })
      .then((json: any) => {
        let isDiceRoll: boolean = false;
        let isSecretDice: boolean = false;
        let diceRollResult: string | null = null;

        if (json.ok) {
          // bcdiceとして結果が取れた
          const resultStr: string = json.result;
          isSecretDice = json.secret;
          diceRollResult = resultStr.replace(/(^: )/g, "").replace(/＞/g, "→");
          isDiceRoll = true;
        } else {
          // bcdiceとして結果は取れなかった
        }
        this.currentMessage = "";

        if (isDiceRoll && isSecretDice) {
          // -------------------
          // シークレットダイス
          // -------------------
          this.addChatLog({
            name: this.getViewName(this.chatActorKey),
            text: `シークレットダイス`,
            color: color,
            tab: outputTab,
            from: ownerKey,
            actorKey: this.chatActorKey,
            statusName: this.statusName,
            target: this.chatTarget,
            owner: this.chatActorKey
          });

          // 隠しダイスロール結果画面に反映
          this.addSecretDice({
            name: this.getViewName(this.chatActorKey),
            diceBot: this.currentDiceBotSystem,
            text: text,
            diceRollResult: diceRollResult,
            color: color,
            tab: outputTab,
            from: ownerKey,
            actorKey: this.chatActorKey,
            statusName: this.statusName,
            target: this.chatTarget,
            owner: this.chatActorKey
          });
        } else {
          // -------------------
          // プレイヤー発言
          // -------------------
          this.addChatLog({
            name: this.getViewName(this.chatActorKey),
            text: text,
            color: color,
            tab: outputTab,
            from: ownerKey,
            actorKey: this.chatActorKey,
            statusName: this.statusName,
            target: this.chatTarget,
            owner: this.chatActorKey
          });
          if (isDiceRoll) {
            // -------------------
            // ダイスロール結果
            // -------------------
            this.addChatLog({
              name: this.currentDiceBotSystem,
              text: diceRollResult,
              color: color,
              tab: outputTab,
              from: ownerKey,
              actorKey: this.chatActorKey,
              statusName: this.statusName,
              target: this.chatTarget,
              owner: this.chatActorKey
            });
          }
        }
      })
      .catch((err: any) => {
        window.console.error(err);
      });
  }

  /**
   * グループチャットタブの発言者の名前を取得する
   * @param tabObj グループチャットオブジェクト
   */
  private otherMatcherObj(tabObj: any): string {
    if (tabObj.isAll) return "";
    return tabObj.group
      .map((g: any) => this.getObj(g))
      .filter((obj: any) => {
        const kind = obj.key.split("-")[0];
        if (kind === "player") {
          if (obj.key === this.playerKey) return true;
        } else {
          if (obj.owner === this.playerKey) return true;
        }
        return false;
      })
      .filter((obj: any) => obj.key !== this.chatActorKey)[0];
  }

  @Watch("roomSystem")
  private onChangeRoomSystem(roomSystem: string) {
    this.currentDiceBotSystem = roomSystem;
  }

  @Watch("currentDiceBotSystem")
  private onChangeCurrentDiceBotSystem(currentDiceBotSystem: any) {
    window.console.log(`ダイスボットシステムを${currentDiceBotSystem}に変更`);
  }

  @Watch("chatLogList")
  private onChangeChatLogList(this: any, chatLogList: any) {
    setTimeout(function() {
      const elm = document.getElementById("chatLog");
      if (elm) {
        elm.scrollTop = elm.scrollHeight;
      }
    }, 0);
  }

  @Watch("inputting", { deep: true })
  private onChangeInputting(this: any, inputting: any) {
    this.inputtingPeerIdList.splice(0, this.inputtingPeerIdList.length);
    for (const name in inputting) {
      if (!inputting.hasOwnProperty(name)) continue;
      if (inputting[name] > 0) {
        this.inputtingPeerIdList.push(name);
      }
    }
  }

  @Watch("secretTarget")
  private onChangeSecretTarget(this: any, secretTarget: any) {
    if (!secretTarget) return;
    window.console.log("selectSecretTalk", secretTarget);
    this.secretTarget = "";
  }

  @Watch("statusName")
  private onChangeStatusName(statusName: string) {
    if (!statusName) this.statusName = "◆";
  }

  private get useCommandActorList(): any[] {
    const resultList: any[] = [];
    this.getSelfActors.forEach((actor: any) => {
      const statusList: any[] = actor.statusList;
      statusList.forEach((status: any) => {
        resultList.push({
          key: actor.key,
          statusName: status.name,
          name: `${this.getViewName(actor.key)}-${status.name}`
        });
      });
    });
    return resultList;
  }

  private get chatOptionPageNum() {
    let index: number = -1;
    if (this.chatOptionSelectMode === "from") {
      index = this.useCommandActorList.findIndex(
        (target: any) =>
          target.key === this.chatActorKey &&
          target.statusName === this.statusName
      );
    }
    if (this.chatOptionSelectMode === "target") {
      index = this.chatTargetList.findIndex(
        (target: any) => target.key === this.chatTarget
      );
    }
    if (this.chatOptionSelectMode === "tab") {
      const list = this.chatTabs.map((tab: any) => ({ key: tab.name }));
      list.unshift({ key: null });
      index = list.findIndex((target: any) => target.key === this.activeTab);
    }
    if (index === -1) return -1;
    return Math.floor(index / this.chatOptionPagingSize) + 1;
  }

  private get chatOptionPageMaxNum() {
    let length: number = 0;
    if (this.chatOptionSelectMode === "from")
      length = this.useCommandActorList.length;
    if (this.chatOptionSelectMode === "target")
      length = this.chatTargetList.length;
    if (this.chatOptionSelectMode === "tab") length = this.chatTabs.length;
    if (length === 0) return 1;
    return Math.floor((length - 1) / this.chatOptionPagingSize) + 1;
  }

  private get chatOptionPagingList() {
    const pageNum = this.chatOptionPageNum;
    const startIndex = (pageNum - 1) * this.chatOptionPagingSize;
    let list: any[] = [];
    if (this.chatOptionSelectMode === "from") {
      list = this.useCommandActorList.concat();
    }
    if (this.chatOptionSelectMode === "target") {
      list = this.chatTargetList.concat();
    }
    if (this.chatOptionSelectMode === "tab") {
      list = this.chatTabs.concat();
      list.unshift({ name: "[選択中]", key: null });
    }
    const endIndex = Math.min(pageNum * this.chatOptionPagingSize, list.length);
    return list.splice(startIndex, endIndex - startIndex);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  display: -webkit-box;
  display: -ms-flexbox;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

.tabs {
  display: flex;
  padding-left: 1em;
  width: 100%;
  box-sizing: border-box;
  z-index: 10;
  margin-bottom: -1px;
}

.tab {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(rgba(240, 240, 240, 1), rgba(0, 0, 0, 0.2));
  padding: 0 0.7em;
  height: 2em;
  box-sizing: border-box;
  border: 1px solid gray;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  margin-right: -1px;
  z-index: 10;
  white-space: nowrap;
  outline: none;

  &.addButton {
    cursor: pointer;
  }
  &.unRead {
    background-color: yellow;
  }

  &:hover {
    border-color: #0092ed;
    z-index: 100;
  }

  &.addButton:active,
  &.active {
    background: white none;
  }
}

#chatLog {
  display: block;
  background-color: white;
  flex: 1;
  -moz-box-flex: 1;
  -webkit-box-flex: 1;
  border: 1px solid gray;
  overflow-y: scroll;
  overflow-x: auto;
  margin: 0;
  padding-left: 2px;
  list-style: none;
  /*font-size: 13px;*/
  min-height: 70px;
  position: relative;
  z-index: 0;
  white-space: normal;
  word-break: break-all;
}

.oneLine {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: left;
  align-items: center;
  height: 26px;
  min-height: 26px;
  padding: 3px 0;
  vertical-align: middle;

  * {
    vertical-align: middle;
    padding: 2px;
  }
}

.sendLine {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;

  .label {
    width: 100%;
    text-align: center;
  }

  > * {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    height: 42px;
    min-height: 42px;
  }

  > div {
    flex-direction: column;

    &:not(.textAreaContainer) {
      margin-top: 2em;
    }
  }
}

.sendLine .textAreaContainer {
  height: 100%;
  flex: 1;
  position: relative;
  display: flex;
}

.sendLine > div > *:not(.chatOptionSelector) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chatInputArea {
  flex: 1;
  display: flex;
  width: 100%;
  font-size: 13px;
}

.chatOption {
  display: flex;
  height: 3.6em;
  padding: 0.2em 0 0.2em 0.4em;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  border-radius: 5px 0 0 5px;
  border: 1px solid gray;
  border-right: 1px dashed gray;
  color: #999;
  background-color: white;
  cursor: default;

  * {
    width: 100%;
    height: 33%;
    display: flex;
    justify-content: left !important;
    align-items: center;
    padding-left: 0.2rem;
    padding-right: 0.4rem;
    border-radius: 5px 0 0 5px;
    font-size: 11px;
  }
}
.chatOption .emphasis {
  color: black;
  font-weight: bold;
}

.diceBotSystem {
  margin-right: 10px;
}

textarea {
  resize: none;
  flex: 1;
  width: 100%;
  height: 3.6em;
  padding: 0.2em 0 0.2em 0.4em;
  font-size: inherit;
  line-height: 1.1em;
  /*border-radius: 0 5px 5px 0;*/
  border: 1px solid gray;
  border-left: none;
  outline: none;

  &::placeholder {
    color: #999;
  }
}

.inputtingArea {
  width: 100%;
  height: 20px;
  background-color: transparent;
  font-size: 10px;

  div {
    display: inline-flex;
    justify-content: left;
    align-items: center;
  }
}

img {
  width: auto;
  height: auto;
  max-width: 20px;
  max-height: 20px;
  cursor: pointer;
  margin: 0 2px;
  border: solid rgba(0, 0, 0, 0) 1px;

  &:hover {
    border-color: #0092ed;
  }
}

span.icon {
  padding: 0;
  margin-right: 4px;
}

i[class^="icon-"] {
  border: 1px solid #777;
  border-radius: 50%;
  font-size: 12px;
  padding: 5px;
  background-color: white;

  &:hover {
    border-color: black;
    color: white;
  }
}

i.icon-dice {
  color: rgb(0, 0, 150);
  &:hover,
  &.hover {
    background-color: rgb(0, 0, 150);
  }
}

i.icon-bin {
  color: rgb(150, 150, 150);
  &:hover,
  &.hover {
    background-color: rgb(150, 150, 150);
  }
}

i.icon-cloud-check,
i.icon-bell {
  color: rgb(150, 150, 0);
  &:hover,
  &.hover {
    background-color: rgb(150, 150, 0);
  }
}

i.icon-music,
i.icon-film {
  color: rgb(0, 150, 150);
  &:hover,
  &.hover {
    background-color: rgb(0, 150, 150);
  }
}

i.icon-list2,
i.icon-accessibility,
i.icon-target {
  color: rgb(150, 0, 150);
  &:hover,
  &.hover {
    background-color: rgb(150, 0, 150);
  }
}

.dep {
  font-size: 11px;
}

.chatOptionSelector {
  padding: 0.5em;
  background-color: lightgreen;
  position: absolute;
  bottom: 100%;
  left: 0;
  cursor: default;
  z-index: 1000;
  max-height: 22.8em;
  overflow-y: auto;
}

.chatOptionSelector .ope {
  color: #777;
}

.chatOptionSelector > span {
  line-height: 1.8em;
}

.chatOptionSelector ul {
  padding: 0;
  margin: 0.5em 0 0;
  list-style: none;
}

.chatOptionSelector li {
  padding: 0.2em 0.8em;
  line-height: 1.6em;
}

.chatOptionSelector .selected {
  background-color: rgba(255, 255, 255, 0.8);
}

.bracketOption {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 1em;
}
</style>
