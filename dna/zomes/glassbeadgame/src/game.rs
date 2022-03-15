pub use hdk::prelude::*;
use hdk::prelude::{holo_hash::{EntryHashB64, HeaderHashB64, AgentPubKeyB64}};

#[hdk_entry(id = "game")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Game {
    pub topic : String,
    pub locked: bool,
    pub intro_duration: usize,
    pub number_of_turns: usize,
    pub move_duration: usize,
    pub interval_duration: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JoinGameInput {
    pub agent: AgentPubKeyB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GameOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64,
    pub game: Game,
    pub author: AgentPubKeyB64,
}


#[hdk_entry(id = "comment")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub comment : String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentInput {
    pub entry_hash: EntryHashB64,
    pub comment: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64,
    pub agent: AgentPubKeyB64,
    pub comment: String,
    pub timestamp: Timestamp,
}


#[hdk_entry(id = "bead")]
#[derive(Clone)]
#[serde(rename_all = "camelCase")]
pub struct Bead {
    pub content : String,
    pub index: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadInput {
    pub entry_hash: EntryHashB64,
    pub bead: Bead,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadOutput {
    pub header_hash: HeaderHashB64,
    pub entry_hash: EntryHashB64,
    pub agent: AgentPubKeyB64,
    pub bead: Bead,
    pub timestamp: Timestamp,
}

fn get_game_path(_game: &Game) -> ExternResult<Path> {
    let path = Path::from("games".to_string());
    path.ensure()?;
    
    Ok(path)
}

#[hdk_extern]
pub fn create_game(game: Game) -> ExternResult<CreateOutput> {

    let header_hash = create_entry(&game)?;
    let hash: EntryHash = hash_entry(&game)?;
    let path = get_game_path(&game)?;
    create_link(path.path_entry_hash()?, hash.clone(), ())?;

    Ok(CreateOutput{
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
pub fn create_comment(input: CommentInput) -> ExternResult<CreateOutput> {
    let comment = Comment{comment: input.comment};
    let header_hash = create_entry(&comment)?;
    let hash: EntryHash = hash_entry(&comment)?;
    create_link(input.entry_hash.into(), hash.clone(), LinkTag::new("comment"))?;

    Ok(CreateOutput{
        header_hash: header_hash.into(),
        entry_hash: hash.into()
    })
}

fn comment_from_details(details: Details) -> ExternResult<Option<CommentOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, headers, .. }) => {
            let comment: Comment = entry.try_into()?;
            let hash = hash_entry(&comment)?;
            let header = headers[0].clone();
            Ok(Some(CommentOutput {
                entry_hash: hash.into(),
                header_hash: header.as_hash().clone().into(),
                comment: comment.comment, 
                agent: header.header().author().clone().into(),
                timestamp: header.header().timestamp(),
            }))
        }
        _ => Ok(None),
    }
} 
fn get_comments_inner(base: EntryHash, maybe_tag: Option<LinkTag>) -> ExternResult<Vec<CommentOutput>> {
    let links = get_links(base, maybe_tag)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let game_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let games: Vec<CommentOutput> = game_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| comment_from_details(details).ok()?)
        .collect();
    Ok(games)
}

#[hdk_extern]
pub fn get_comments(entry_hash: EntryHashB64) -> ExternResult<Vec<CommentOutput>> {

    get_comments_inner(entry_hash.into(), Some(LinkTag::new("comment")))
}


#[hdk_extern]
pub fn create_bead(input: BeadInput) -> ExternResult<CreateOutput> {
    let header_hash = create_entry(&input.bead)?;
    let hash: EntryHash = hash_entry(&input.bead)?;
    create_link(input.entry_hash.into(), hash.clone(), LinkTag::new("bead"))?;

    Ok(CreateOutput{
        header_hash: header_hash.into(),
        entry_hash: hash.into()
    })
}

fn bead_from_details(details: Details) -> ExternResult<Option<BeadOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, headers, .. }) => {
            let bead: Bead = entry.try_into()?;
            let hash = hash_entry(&bead)?;
            let header = headers[0].clone();
            Ok(Some(BeadOutput {
                entry_hash: hash.into(),
                header_hash: header.as_hash().clone().into(),
                bead, 
                agent: header.header().author().clone().into(),
                timestamp: header.header().timestamp(),
            }))
        }
        _ => Ok(None),
    }
} 
fn get_beads_inner(base: EntryHash, maybe_tag: Option<LinkTag>) -> ExternResult<Vec<BeadOutput>> {
    let links = get_links(base, maybe_tag)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let game_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let games: Vec<BeadOutput> = game_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| bead_from_details(details).ok()?)
        .collect();
    Ok(games)
}

#[hdk_extern]
pub fn get_beads(entry_hash: EntryHashB64) -> ExternResult<Vec<BeadOutput>> {

    get_beads_inner(entry_hash.into(), Some(LinkTag::new("bead")))
}
