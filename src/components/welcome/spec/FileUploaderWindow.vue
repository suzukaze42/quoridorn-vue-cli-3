<template>
  <spec-frame property="fileUploaderWindow" label-str="ファイルアップローダー" lastVersion="1.0.0b1" :isSpecFixed="true">
    <!----------------------
     ! 起動操作
     !--------------------->
    <spec-item class-str="operation" label-str="起動操作">
      <li>画面上部メニューの「画像」を選択</li>
      <li>「ファイルアップローダー」を選択</li>
    </spec-item>
    <!----------------------
     ! 仕様
     !--------------------->
    <spec-item class-str="spec" label-str="仕様">
      <li>
        以下の情報を付与して画像ファイルを利用可能にする
        <ol>
          <li>タグ</li>
          <li>隠し画像パスワード</li>
        </ol>
      </li>
      <li>
        対応する拡張子は以下の通り
        <ol>
          <li>png</li>
          <li>jpg(jpeg)</li>
          <li>gif(アニメーション可能)</li>
        </ol>
        容量制限はなし（軽い画像にしないと通信的に悪影響が出るかもしれないけど技術的には可能なので制限は設けない）
      </li>
      <li>
        ファイル名に "_"(アンダースコア) が２つ連続で含まれている場合、その画像を「差分画像」と見なす。<br>
        利用時にはアンダースコアの左側の部分を「本体画像」のファイル名として検索し、見つかれば「差分画像」として設定画面に表示する。<br>
        本体画像が見つからなければ、その差分画像は「画像削除」機能でしか参照できない画像となる。
      </li>
      <li>
        「差分画像」は「本体画像」のファイルと同じ画像サイズであること。<br>
        「差分画像」は「本体画像」と重ねて表示するが、表示領域に合わせて伸縮させるので、サイズが合ってないと変な表示になる。
      </li>
    </spec-item>
    <!----------------------
     ! ユーザ要望
     !--------------------->
    <spec-item class-str="request" label-str="ユーザ要望">
      <li>なし</li>
    </spec-item>
    <!----------------------
     ! 未実装事項
     !--------------------->
    <spec-item class-str="unImplemented" label-str="未実装事項">
      <li>本機能自体が未実装<br>→ 初回リリースに含める。</li>
    </spec-item>
    <!----------------------
     ! 実装しない機能
     !--------------------->
    <spec-item class-str="unSupport" label-str="実装しない機能">
      <li>なし</li>
    </spec-item>
    <!----------------------
     ! 関連項目
     !--------------------->
    <spec-item class-str="ref" label-str="関連項目">
      <li><spec-link property="menuBar" title-str="">メインメニュー</spec-link></li>
    </spec-item>
  </spec-frame>
</template>

<script>
import SpecMixin from "./SpecMixin";
export default { mixins: [SpecMixin] };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped src="./spec.css">
</style>
