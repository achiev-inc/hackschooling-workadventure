<script lang="typescript">

  import type { Unsubscriber } from "svelte/store";
  import { emoteStore, emoteMenuStore } from "../../Stores/EmoteStore";
  import { onDestroy, onMount } from "svelte";
  import { EmojiButton } from '@joeattardi/emoji-button';
  import { isMobile } from "../../Enum/EnvironmentVariable";

  let emojiContainer: HTMLElement;
  let picker: EmojiButton;

  let unsubscriber: Unsubscriber | null = null;

  onMount(() => {
    picker = new EmojiButton({
      rootElement: emojiContainer,
      styleProperties: {
        '--font': 'Press Start 2P'
      },
      emojisPerRow: isMobile() ? 6 : 8,
      autoFocusSearch: false,
      style: 'twemoji',
    });
    //the timeout is here to prevent the menu from flashing
    setTimeout(() => picker.showPicker(emojiContainer), 100);

    picker.on("emoji", (selection) => {
      emoteStore.set({
        unicode: selection.emoji,
        url: selection.url,
        name: selection.name
      });
    });

    picker.on("hidden", () => {
      emoteMenuStore.closeEmoteMenu();
    });

  })

  function onKeyDown(e:KeyboardEvent) {
    if (e.key === 'Escape') {
      emoteMenuStore.closeEmoteMenu();
    }
  }

  onDestroy(() => {
    if (unsubscriber) {
      unsubscriber();
    }

    picker.destroyPicker();
  })

</script>

<svelte:window on:keydown={onKeyDown}/>

<div class="emote-menu-container">
  <div class="emote-menu" bind:this={emojiContainer}></div>
</div>

<style lang="scss">
  .emote-menu-container {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }

  .emote-menu {
    pointer-events: all;
  }
</style>