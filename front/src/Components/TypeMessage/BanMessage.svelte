<script lang="ts">
    import { fly } from "svelte/transition";
    import {banMessageVisibleStore, banMessageContentStore} from "../../Stores/TypeMessageStore/BanMessageStore";
    import {onMount} from "svelte";

    const text = $banMessageContentStore;
    const NAME_BUTTON = 'Ok';
    let nbSeconds = 10;
    let nameButton = '';

    onMount(() => {
        timeToRead()
    })

    function timeToRead() {
        nbSeconds -= 1;
        nameButton = nbSeconds.toString();
        if ( nbSeconds > 0 ) {
            setTimeout( () => {
                timeToRead();
            }, 1000);
        } else {
            nameButton = NAME_BUTTON;
        }
    }

    function closeBanMessage() {
        banMessageVisibleStore.set(false);
    }
</script>

<div class="main-ban-message nes-container is-rounded" transition:fly="{{ y: -1000, duration: 500 }}">
    <h2 class="title-ban-message"><img src="resources/logos/report.svg" alt="***"/> Message important <img src="resources/logos/report.svg" alt="***"/></h2>
    <div class="content-ban-message">
        <p>{text}</p>
    </div>
    <div class="footer-ban-message">
        <button type="button" class="nes-btn {nameButton === NAME_BUTTON ? 'is-primary' : 'is-error'}" disabled="{!(nameButton === NAME_BUTTON)}" on:click|preventDefault={closeBanMessage}>{nameButton}</button>
    </div>
    <audio id="report-message" autoplay>
        <source src="/resources/objects/report-message.mp3" type="audio/mp3">
    </audio>
</div>


<style lang="scss">
  div.main-ban-message {
    display: flex;
    flex-direction: column;
    position: relative;
    top: 15vh;

    height: 70vh;
    width: 60vw;
    margin-left: auto;
    margin-right: auto;
    padding-bottom: 0;

    pointer-events: auto;
    background-color: #333333;
    color: whitesmoke;

    h2.title-ban-message {
      flex: 1 1 auto;
      max-height: 50px;
      margin-bottom: 20px;

      text-align: center;

      img {
        height: 50px;
      }
    }

    div.content-ban-message {
      flex: 1 1 auto;
      max-height: calc(100% - 50px);
      overflow: auto;

      p {
        white-space: pre-wrap;
      }
    }

    div.footer-ban-message {
      height: 50px;
      margin-top: 10px;
      text-align: center;

      button {
        width: 88px;
        height: 44px;
      }
    }
  }
</style>
