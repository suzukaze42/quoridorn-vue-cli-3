<template>
  <div
    class="diceSymbol"
    :class="[ isHover ? 'hover' : '', isHide ? 'isHide' : '' ]"
    :style="chitStyle"
    @click.right.prevent="(e) => openContext(e, 'private.display.diceSymbolContext')"
    @mouseover="mouseover"
    @mouseout="mouseout"
    @mousedown.left.stop="leftDown"
    @mouseup.left.stop="leftUp"
    @mousedown.right.stop="rightDown"
    @mouseup.right.stop="rightUp"
    @touchstart="leftDown" @touchend="leftUp"
    @touchcancel="leftUp"
    @contextmenu.prevent
  >
    <div class="border"></div>
    <img class="image" v-img="diceImage" draggable="false" v-if="!isAbsoluteHide"/>
    <div class="balloon" v-if="isHover">
      <span v-if="ownerPlayer">[{{ownerPlayer.name}}]のダイス</span>
      <span>{{ isHide ? "非公開：" : "" }}{{isAbsoluteHide ? '' : `${pips} / D${faceNum}`}}</span>
    </div>
  </div>
</template>

<script lang="ts">
import PieceMixin from "../../PieceMixin.vue";

import { Component, Watch } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";

@Component({})
export default class DiceSymbol extends PieceMixin {
  @Getter("dicePipsImage") private dicePipsImage: any;
  @Getter("playerKey") private playerKey: any;

  private getKeyObj(list: any[], key: string) {
    const filteredList = list.filter(obj => obj.key === key);
    if (filteredList.length === 0) return null;
    if (filteredList.length > 1) return null;
    return filteredList[0];
  }

  private get chitStyle() {
    let obj: any = this.style;
    if (this.storeObj.isDraggingLeft) {
      const plus = 1.5;
      obj.left = this.rect.left - plus + "px";
      obj.top = this.rect.top - plus + "px";
      obj.width = this.rect.width + plus * 2 + "px";
      obj.height = this.rect.height + plus * 2 + "px";
      obj.opacity = 0.6;
    }
    // window.console.log(` [computed] chit(${this.objKey}) style => lt(${obj.left}, ${obj.top}), wh(${obj.width}, ${obj.height}), bg:"${obj['background-color']}", font:"${obj.color}"`)
    return obj;
  }

  private get faceNum() {
    return this.storeObj.faceNum;
  }

  private get diceType() {
    return this.storeObj.type;
  }

  private get pips() {
    return this.storeObj.pips;
  }

  private get isHide() {
    return this.storeObj.isHide;
  }

  private get isAbsoluteHide() {
    if (!this.isHide) return false;
    return this.owner !== this.playerKey;
  }

  private get owner() {
    return this.storeObj.owner;
  }

  private get ownerPlayer() {
    const player: any = this.getObj(this.owner);
    return player;
  }

  private get diceImage() {
    return this.dicePipsImage(this.faceNum, this.diceType, this.pips);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import "../../common.scss";

.diceSymbol {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  font-size: 12px;
  cursor: crosshair;
  border-radius: 3px;
  z-index: 100000000;

  &.hover,
  &.rolling {
    z-index: 999999999;
  }

  &.isHide {
    background-color: black;
  }

  &:before {
    content: "";
    position: absolute;
    left: -2px;
    right: -2px;
    bottom: -2px;
    top: -2px;
    border: 2px solid #99660f;
    border-radius: 2px;
  }

  .balloon {
    @include flex-box(column, flex-start);
    position: absolute;
    background-color: lightyellow;
    border-radius: 5px;
    padding: 0.5em;
    font-size: 10px;
    top: 80%;
    left: 80%;
  }
}

img.image {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.border {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 4px solid rgb(187, 187, 0);
  border-radius: 1px;
}
</style>
