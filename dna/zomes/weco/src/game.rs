pub use hdk::prelude::*;

const GAME_ANCHOR_TYPE: &str = "game";
const GAME_ANCHOR_TEXT: &str = "game";

#[hdk_entry(id = "game")]
#[derive(Clone)]
pub struct Game {
    pub topic : String,
    pub player_order : u32,
    pub number_of_turns : u32,
    pub move_duration : u32,
    pub intro_duration : u32,
    pub interval_duration : u32,
    pub locked : bool,
    pub created_at : String,
    pub updated_at : String
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GameCreateInput {
    pub topic : String,
    pub current_time : String
}

#[hdk_extern]
pub fn create_game(input: GameCreateInput) -> ExternResult<Game> {
    let game: Game = Game {
        topic : input.topic,
        player_order : 0,
        number_of_turns : 0,
        move_duration : 0,
        interval_duration : 0,
        intro_duration : 0,
        locked : false,
        created_at : input.current_time.clone(),
        updated_at : input.current_time
    };

    let anchor = anchor(GAME_ANCHOR_TYPE.into(), GAME_ANCHOR_TEXT.into())?;

    let _user_header = create_entry(&game)?;
    let hash: EntryHash = hash_entry(&game)?;

    create_link(anchor.into_hash(), hash, ())?;

    Ok(game)
}
