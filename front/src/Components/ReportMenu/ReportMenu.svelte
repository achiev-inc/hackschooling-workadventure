<script lang="ts">
    import {showReportScreenStore, userReportEmpty} from "../../Stores/ShowReportScreenStore";
    import BlockSubMenu from "./BlockSubMenu.svelte";
    import ReportSubMenu from "./ReportSubMenu.svelte";
    import {onDestroy, onMount} from "svelte";
    import type {Unsubscriber} from "svelte/store";
    import {playersStore} from "../../Stores/PlayersStore";
    import {connectionManager} from "../../Connexion/ConnectionManager";
    import {GameConnexionTypes} from "../../Url/UrlManager";
    import {get} from "svelte/store";

    let blockActive =  true;
    let reportActive = !blockActive;
    let anonymous: boolean = false;
    let userUUID: string | undefined = playersStore.getPlayerById(get(showReportScreenStore).userId)?.userUuid;
    let userName = "No name";
    let unsubscriber: Unsubscriber

    onMount(() => {
        unsubscriber = showReportScreenStore.subscribe((reportScreenStore) => {
            if (reportScreenStore != null) {
                userName = reportScreenStore.userName;
                userUUID = playersStore.getPlayerById(reportScreenStore.userId)?.userUuid;
                if (userUUID === undefined && reportScreenStore !== userReportEmpty) {
                    console.error("Impossible de trouver l'UUID pour l'utilisateur avec ID " + reportScreenStore.userId);
                }
            }
        })
        anonymous = connectionManager.getConnexionType === GameConnexionTypes.anonymous;
    })

    onDestroy(() => {
        if (unsubscriber) {
            unsubscriber();
        }
    })

    function close() {
        showReportScreenStore.set(userReportEmpty);
    }

    function activateBlock() {
        blockActive = true;
        reportActive = false;
    }

    function activateReport() {
        blockActive = false;
        reportActive = true;
    }

    function onKeyDown(e:KeyboardEvent) {
        if (e.key === 'Escape') {
            close();
        }
    }
</script>

<svelte:window on:keydown={onKeyDown}/>

<div class="report-menu-main nes-container is-rounded">
    <section class="report-menu-title">
        <h2>Modérer {userName}</h2>
        <section class="justify-center">
            <button type="button" class="nes-btn" on:click|preventDefault={close}>X</button>
        </section>
    </section>
    <section class="report-menu-action {anonymous ? 'hidden' : ''}">
        <section class="justify-center">
            <button type="button" class="nes-btn {blockActive ? 'is-disabled' : ''}" on:click|preventDefault={activateBlock}>Bloquer</button>
        </section>
        <section class="justify-center">
            <button type="button" class="nes-btn {reportActive ? 'is-disabled' : ''}" on:click|preventDefault={activateReport}>Signaler</button>
        </section>
    </section>
    <section class="report-menu-content">
        {#if blockActive}
            <BlockSubMenu userUUID="{userUUID}" userName="{userName}"/>
        {:else if reportActive}
            <ReportSubMenu userUUID="{userUUID}"/>
        {:else }
            <p>ERREUR : Aucune action n'est sélectionnée.</p>
        {/if}
    </section>
</div>

<style lang="scss">
  .nes-container {
    padding: 5px;
  }

  section.justify-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  div.report-menu-main {
    font-family: "Press Start 2P";
    pointer-events: auto;
    background-color: #333333;
    color: whitesmoke;

    position: relative;
    height: 70vh;
    width: 50vw;
    top: 10vh;
    margin: auto;

    section.report-menu-title {
      display: grid;
      grid-template-columns: calc(100% - 45px) 40px;
      margin-bottom: 20px;

      h2 {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    section.report-menu-action {
      display: grid;
      grid-template-columns: 50% 50%;
      margin-bottom: 20px;
    }

    section.report-menu-action.hidden {
      display: none;
    }
  }

  @media only screen and (max-width: 800px) {
    div.report-menu-main {
      top: 21vh;
      height: 60vh;
      width: 100vw;
      font-size: 0.5em;
    }
  }
</style>
