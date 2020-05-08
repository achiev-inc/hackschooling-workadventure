import {GameManager, gameManager, HasMovedEvent, StatusGameManagerEnum} from "./GameManager";
import {GroupCreatedUpdatedMessageInterface, MessageUserPositionInterface} from "../../Connexion";
import {CurrentGamerInterface, GamerInterface, hasMovedEventName, Player} from "../Player/Player";
import {DEBUG_MODE, RESOLUTION, ROOM, ZOOM_LEVEL} from "../../Enum/EnvironmentVariable";
import Tile = Phaser.Tilemaps.Tile;
import {ITiledMap, ITiledTileSet} from "../Map/ITiledMap";
import {cypressAsserter} from "../../Cypress/CypressAsserter";
import {PLAYER_RESOURCES} from "../Entity/PlayableCaracter";
import Circle = Phaser.Geom.Circle;
import Graphics = Phaser.GameObjects.Graphics;
import Texture = Phaser.Textures.Texture;
import Sprite = Phaser.GameObjects.Sprite;
import CanvasTexture = Phaser.Textures.CanvasTexture;

export const GameSceneName = "GameScene";
export enum Textures {
    Player = 'male1',
    Map = 'map'
}

export interface GameSceneInterface extends Phaser.Scene {
    Map: Phaser.Tilemaps.Tilemap;
    createCurrentPlayer(UserId : string) : void;
    shareUserPosition(UsersPosition : Array<MessageUserPositionInterface>): void;
}
export class GameScene extends Phaser.Scene implements GameSceneInterface{
    GameManager : GameManager;
    Terrains : Array<Phaser.Tilemaps.Tileset>;
    CurrentPlayer: CurrentGamerInterface;
    MapPlayers : Phaser.Physics.Arcade.Group;
    Map: Phaser.Tilemaps.Tilemap;
    Layers : Array<Phaser.Tilemaps.StaticTilemapLayer>;
    Objects : Array<Phaser.Physics.Arcade.Sprite>;
    map: ITiledMap;
    groups: Map<string, Sprite>
    startX = 704;// 22 case
    startY = 32; // 1 case
    circleTexture: CanvasTexture;

    constructor() {
        super({
            key: GameSceneName
        });
        this.GameManager = gameManager;
        this.Terrains = [];
        this.groups = new Map<string, Sprite>();
    }

    //hook preload scene
    preload(): void {
        this.GameManager.setCurrentGameScene(this);
        let mapUrl = 'maps/map.json';
        this.load.on('filecomplete-tilemapJSON-'+Textures.Map, (key: string, type: string, data: any) => {
            // Triggered when the map is loaded
            // Load tiles attached to the map recursively
            this.map = data.data;
            this.map.tilesets.forEach((tileset) => {
                if (typeof tileset.name === 'undefined' || typeof tileset.image === 'undefined') {
                    console.warn("Don't know how to handle tileset ", tileset)
                    return;
                }
                let path = mapUrl.substr(0, mapUrl.lastIndexOf('/'));
                this.load.image(tileset.name, path + '/' + tileset.image);
            })
        });
        this.load.tilemapTiledJSON(Textures.Map, mapUrl);

        //add player png
        PLAYER_RESOURCES.forEach((playerResource: any) => {
            this.load.spritesheet(
                playerResource.name,
                playerResource.img,
                {frameWidth: 32, frameHeight: 32}
            );
        });

        this.load.bitmapFont('main_font', 'resources/fonts/arcade.png', 'resources/fonts/arcade.xml');
    }

    //hook initialisation
    init() {
    }

    //hook create scene
    create(): void {
        //initalise map
        this.Map = this.add.tilemap("map");
        this.map.tilesets.forEach((tileset: ITiledTileSet) => {
            this.Terrains.push(this.Map.addTilesetImage(tileset.name, tileset.name));
        });

        //permit to set bound collision
        this.physics.world.setBounds(0,0, this.Map.widthInPixels, this.Map.heightInPixels);

        //add layer on map
        this.Layers = new Array<Phaser.Tilemaps.StaticTilemapLayer>();
        let depth = -2;
        this.map.layers.forEach((layer) => {
            if (layer.type === 'tilelayer') {
                this.addLayer(this.Map.createStaticLayer(layer.name, this.Terrains, 0, 0).setDepth(depth));
            }
            if (layer.type === 'objectgroup' && layer.name === 'floorLayer') {
                depth = 10000;
            }
        });

        if (depth === -2) {
            throw new Error('Your map MUST contain a layer of type "objectgroup" whose name is "floorLayer" that represents the layer characters are drawn at.');
        }

        //add entities
        this.Objects = new Array<Phaser.Physics.Arcade.Sprite>();

        //init event click
        this.EventToClickOnTile();

        //initialise list of other player
        this.MapPlayers = this.physics.add.group({ immovable: true });

        //notify game manager can to create currentUser in map
        this.GameManager.createCurrentPlayer();


        //initialise camera
        this.initCamera();


        // Let's generate the circle for the group delimiter

        this.circleTexture = this.textures.createCanvas('circleSprite', 96, 96);
        let context = this.circleTexture.context;
        context.beginPath();
        context.arc(48, 48, 48, 0, 2 * Math.PI, false);
        // context.lineWidth = 5;
        context.strokeStyle = '#ffffff';
        context.stroke();

        this.circleTexture.refresh();
    }

    //todo: in a dedicated class/function?
    initCamera() {
        this.cameras.main.setBounds(0,0, this.Map.widthInPixels, this.Map.heightInPixels);
        this.cameras.main.startFollow(this.CurrentPlayer);
        this.cameras.main.setZoom(ZOOM_LEVEL);
    }

    addLayer(Layer : Phaser.Tilemaps.StaticTilemapLayer){
        this.Layers.push(Layer);
    }

    createCollisionWithPlayer() {
        //add collision layer
        this.Layers.forEach((Layer: Phaser.Tilemaps.StaticTilemapLayer) => {
            this.physics.add.collider(this.CurrentPlayer, Layer, (object1: any, object2: any) => {
                //this.CurrentPlayer.say("Collision with layer : "+ (object2 as Tile).layer.name)
            });
            Layer.setCollisionByProperty({collides: true});
            if (DEBUG_MODE) {
                //debug code to see the collision hitbox of the object in the top layer
                Layer.renderDebug(this.add.graphics(), {
                    tileColor: null, //non-colliding tiles
                    collidingTileColor: new Phaser.Display.Color(243, 134, 48, 200), // Colliding tiles,
                    faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Colliding face edges
                });
            }
        });
    }

    addSpite(Object : Phaser.Physics.Arcade.Sprite){
        Object.setImmovable(true);
        this.Objects.push(Object);
    }

    createCollisionObject(){
        this.Objects.forEach((Object : Phaser.Physics.Arcade.Sprite) => {
            this.physics.add.collider(this.CurrentPlayer, Object, (object1: any, object2: any) => {
                //this.CurrentPlayer.say("Collision with object : " + (object2 as Phaser.Physics.Arcade.Sprite).texture.key)
            });
        })
    }

    createCurrentPlayer(UserId : string){
        //initialise player
        this.CurrentPlayer = new Player(
            UserId,
            this,
            this.startX,
            this.startY,
            this.GameManager.getPlayerName(),
            this.GameManager.getCharacterSelected()
        );
        this.CurrentPlayer.initAnimation();

        //create collision
        this.createCollisionWithPlayer();
        this.createCollisionObject();
        this.CurrentPlayer.on(hasMovedEventName, this.pushPlayerPosition.bind(this))
    }

    pushPlayerPosition(event: HasMovedEvent) {
        this.GameManager.pushPlayerPosition(event);
    }

    EventToClickOnTile(){
        // debug code to get a tile properties by clicking on it
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer)=>{
            //pixel position toz tile position
            let tile = this.Map.getTileAt(this.Map.worldToTileX(pointer.worldX), this.Map.worldToTileY(pointer.worldY));
            if(tile){
                console.log(tile)
                this.CurrentPlayer.say("Your touch " + tile.layer.name);
            }
        });
    }

    /**
     * @param time
     * @param delta The delta time in ms since the last frame. This is a smoothed and capped value based on the FPS rate.
     */
    update(time: number, delta: number) : void {
        this.CurrentPlayer.moveUser(delta);
    }

    /**
     * Share position in scene
     * @param UsersPosition
     */
    shareUserPosition(UsersPosition : Array<MessageUserPositionInterface>): void {
        this.updateOrCreateMapPlayer(UsersPosition);
    }

    /**
     * Create new player and clean the player on the map
     * @param UsersPosition
     */
    updateOrCreateMapPlayer(UsersPosition : Array<MessageUserPositionInterface>){
        if(!this.CurrentPlayer){
            return;
        }

        //add or create new user
        UsersPosition.forEach((userPosition : MessageUserPositionInterface) => {
            if(userPosition.userId === this.CurrentPlayer.userId){
                return;
            }
            let player = this.findPlayerInMap(userPosition.userId);
            if(!player){
                this.addPlayer(userPosition);
            }else{
                player.updatePosition(userPosition);
            }
        });

        //clean map
        this.MapPlayers.getChildren().forEach((player: GamerInterface) => {
            if(UsersPosition.find((message : MessageUserPositionInterface) => message.userId === player.userId)){
                return;
            }
            player.destroy();
            this.MapPlayers.remove(player);
        });
    }

    private findPlayerInMap(UserId : string) : GamerInterface | null{
        let player = this.MapPlayers.getChildren().find((player: Player) => UserId === player.userId);
        if(!player){
            return null;
        }
        return (player as GamerInterface);
    }

    /**
     * Create new player
     * @param MessageUserPosition
     */
    addPlayer(MessageUserPosition : MessageUserPositionInterface){
        //initialise player
        let player = new Player(
            MessageUserPosition.userId,
            this,
            MessageUserPosition.position.x,
            MessageUserPosition.position.y,
            MessageUserPosition.name,
            MessageUserPosition.character
        );
        player.initAnimation();
        this.MapPlayers.add(player);
        player.updatePosition(MessageUserPosition);

        //init collision
        /*this.physics.add.collider(this.CurrentPlayer, player, (CurrentPlayer: CurrentGamerInterface, MapPlayer: GamerInterface) => {
            CurrentPlayer.say("Hello, how are you ? ");
        });*/
    }

    shareGroupPosition(groupPositionMessage: GroupCreatedUpdatedMessageInterface) {
        let groupId = groupPositionMessage.groupId;

        if (this.groups.has(groupId)) {
            this.groups.get(groupId).setPosition(Math.round(groupPositionMessage.position.x), Math.round(groupPositionMessage.position.y));
        } else {
            // TODO: circle radius should not be hard stored
            let sprite = new Sprite(this, Math.round(groupPositionMessage.position.x), Math.round(groupPositionMessage.position.y), 'circleSprite');
            sprite.setDisplayOrigin(48, 48);
            this.add.existing(sprite);
            this.groups.set(groupId, sprite);
        }
    }

    deleteGroup(groupId: string): void {
        this.groups.get(groupId).destroy();
        this.groups.delete(groupId);
    }
}
