pub use hdk::prelude::*;
use hdk::prelude::{holo_hash::{EntryHashB64, HeaderHashB64, AgentPubKeyB64}};

#[hdk_entry(id = "game")]
#[derive(Clone)]
pub struct Game {
    pub topic : String,
    pub locked: bool,
    pub intro_duration: usize,
    pub number_of_turns: usize,
    pub move_duration: usize,
    pub interval_duration: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
 pub struct JoinGameInput {
    pub agent: AgentPubKeyB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
 pub struct CreateGameOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
 pub struct GameOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64,
    pub game: Game,
    pub created_by: AgentPubKeyB64,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MessageInput {
    game : EntryHash,
    agent : AgentPubKeyB64,
    message : String
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NotificationInput {
    user: String,
    message : String
}

fn get_game_path(_game: &Game) -> ExternResult<Path> {
    //TODO: tree by topic or other segmenting
    let path = Path::from("games".to_string());
    path.ensure()?;
    
    Ok(path)
}

#[hdk_extern]
pub fn create_game(game: Game) -> ExternResult<CreateGameOutput> {

    let header_hash = create_entry(&game)?;
    let hash: EntryHash = hash_entry(&game)?;
    let path = get_game_path(&game)?;
    create_link(path.path_entry_hash()?, hash.clone(), ())?;

    Ok(CreateGameOutput{
        header_hash: header_hash.into(),
        entry_hash: hash.into()
    })
}

#[hdk_extern]
pub fn join_game(input: JoinGameInput) -> ExternResult<HeaderHashB64> {
    let header_hash = create_link(input.entry_hash.into(),AgentPubKey::from(input.agent).into(),  ())?;
    Ok(header_hash.into())
}

#[hdk_extern]
pub fn get_players(game_hash: EntryHashB64) -> ExternResult<Vec<(AgentPubKeyB64, HeaderHashB64)>> {
    let links = get_links(game_hash.into(), None)?;

    let mut agents: Vec<(AgentPubKeyB64, HeaderHashB64)> = vec![];
    for link in links {
        let agent: AgentPubKey = link.target.into();
        agents.push((agent.into(), link.create_link_hash.into()));
    }     
    Ok(agents)
}

#[hdk_extern]
pub fn leave_game(input: HeaderHashB64) -> ExternResult<HeaderHashB64> {
    let header_hash = delete_link(input.into())?;
    Ok(header_hash.into())
}

#[hdk_extern]
pub fn get_games(_: ()) -> ExternResult<Vec<GameOutput>> {

    let path = Path::from("games".to_string());

    get_games_inner(path.path_entry_hash()?, None)
}

fn game_from_details(details: Details) -> ExternResult<Option<GameOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, headers, .. }) => {
            let game: Game = entry.try_into()?;
            let hash = hash_entry(&game)?;
            let header = headers[0].clone();
            Ok(Some(GameOutput {
                entry_hash: hash.into(),
                header_hash: header.as_hash().clone().into(),
                game, 
                created_by: header.header().author().clone().into(),
            }))
        }
        _ => Ok(None),
    }
} 

fn get_games_inner(base: EntryHash, maybe_tag: Option<LinkTag>) -> ExternResult<Vec<GameOutput>> {
    let links = get_links(base, maybe_tag)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let game_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let games: Vec<GameOutput> = game_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| game_from_details(details).ok()?)
        .collect();
    Ok(games)
}

#[hdk_extern]
fn get_game(game_entry_hash: EntryHashB64) -> ExternResult<GameOutput> {
    let entry_hash: EntryHash = game_entry_hash.into();
    let maybe_output = match get_details(entry_hash,GetOptions::default())? {
        Some(details) => game_from_details(details)?,
        None => None,
    };
    Ok(maybe_output.ok_or(WasmError::Guest("Game not found".into()))?)
}

#[hdk_extern]
pub fn receive_notification(input: NotificationInput) -> ExternResult<()> {
    Ok(emit_signal(input)?)
}
