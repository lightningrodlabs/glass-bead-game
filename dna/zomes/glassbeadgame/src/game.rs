pub use hdk::prelude::*;
use hdk::prelude::{holo_hash::{EntryHashB64, ActionHashB64, AgentPubKeyB64}};
use glassbeadgame_core::{Game, Bead, Comment, EntryTypes, LinkTypes, GameSettings};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JoinGameInput {
    pub agent: AgentPubKeyB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateGameOutput {
    pub action_hash: ActionHashB64,
    pub settings_action_hash: ActionHashB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutput {
    pub action_hash: ActionHashB64,
    pub entry_hash: EntryHashB64
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateOutput {
    pub settings_action_hash: ActionHashB64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GameOutput {
    pub entry_hash: EntryHashB64,
    pub settings: GameSettings,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGameInput {
    pub game_entry_hash: EntryHash,
    pub game: GameSettings
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
    pub action_hash: ActionHashB64,
    pub entry_hash: EntryHashB64,
    pub agent: AgentPubKeyB64,
    pub comment: String,
    pub timestamp: Timestamp,
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
    pub action_hash: ActionHashB64,
    pub entry_hash: EntryHashB64,
    pub agent: AgentPubKeyB64,
    pub bead: Bead,
    pub timestamp: Timestamp,
}

fn get_game_path(_game: &Game) -> ExternResult<Path> {
    let path = Path::from("games".to_string());
    let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Game)?);
    typed_path.ensure()?;
    
    Ok(path)
}

#[hdk_extern]
pub fn create_game(settings: GameSettings) -> ExternResult<CreateGameOutput> {
    let settings_action_hash = create_entry(EntryTypes::GameSettings(settings.clone()))?;
    let game = Game {
        id: settings_action_hash.clone(),
    };
    let action_hash = create_entry(EntryTypes::Game(game.clone()))?;
    let hash: EntryHash = hash_entry(&game)?;
    let path = get_game_path(&game)?;
    create_link(path.path_entry_hash()?, hash.clone(), LinkTypes::Game, ())?;
    create_link(hash.clone(), settings_action_hash.clone(), LinkTypes::Settings, ())?;

    Ok(CreateGameOutput{
        action_hash: action_hash.into(),
        settings_action_hash: settings_action_hash.into(),
        entry_hash: hash.into()
    })
}

#[hdk_extern]
pub fn update_game(input: UpdateGameInput) -> ExternResult<UpdateOutput> {
    let settings_action_hash = create_entry(EntryTypes::GameSettings(input.game.clone()))?;
    let hash: EntryHash = hash_entry(input.game)?;

    create_link(input.game_entry_hash, hash.clone(), LinkTypes::Settings, ())?;

    Ok(UpdateOutput{
        settings_action_hash: settings_action_hash.into(),
    })
}


#[hdk_extern]
pub fn join_game(input: JoinGameInput) -> ExternResult<ActionHashB64> {
    let entry_hash: EntryHash = input.entry_hash.into();
    let action_hash  = create_link(AnyLinkableHash::from(entry_hash),AnyLinkableHash::from(AgentPubKey::from(input.agent)), LinkTypes::Player, ())?;
    Ok(action_hash.into())
}

#[hdk_extern]
pub fn get_players(game_hash: EntryHashB64) -> ExternResult<Vec<(AgentPubKeyB64, ActionHashB64)>> {
    let hash : EntryHash = game_hash.into();
    let links = get_links(AnyLinkableHash::from(hash), LinkTypes::Player, None)?;

    let mut agents: Vec<(AgentPubKeyB64, ActionHashB64)> = vec![];
    for link in links {
        let agent: EntryHash = EntryHash::try_from(link.target)?; // gotta go through an agent hash because can't get there direct yet!
        let agent: AgentPubKey = AgentPubKey::try_from(agent)?;
        let agentpubkey: AgentPubKey = AgentPubKey::try_from(agent)?;
        agents.push((agentpubkey.into(), link.create_link_hash.into()));
    }     
    Ok(agents)
}

#[hdk_extern]
pub fn leave_game(input: ActionHashB64) -> ExternResult<ActionHashB64> {
    let action_hash = delete_link(input.into())?;
    Ok(action_hash.into())
}

#[hdk_extern]
pub fn get_games(_: ()) -> ExternResult<Vec<GameOutput>> {
    let path = Path::from("games".to_string());
    get_games_inner(path.path_entry_hash()?)
}

fn game_from_details(details: Details) -> ExternResult<Option<GameOutput>> {
    match details {
        Details::Record(RecordDetails { record, .. }) => {
            let settings: GameSettings = record.try_into()?;
            let hash = hash_entry(&settings)?;
            Ok(Some(GameOutput {
                entry_hash: hash.into(),
                settings,
            }))
        }
        _ => Ok(None),
    }
} 

fn get_games_inner(base: EntryHash) -> ExternResult<Vec<GameOutput>> {
    let links = get_links(base, LinkTypes::Game, None)?;

    let mut get_input = vec![];
    for link in links {
        get_input.push(GetLinksInput::new(link.target.into(), LinkTypes::Settings.try_into()?, None))
    }

    let all_settings = HDK.with(|hdk| hdk.borrow().get_link_details(get_input))?;

    let mut games: Vec<GameOutput> = vec![];
    for link_details in all_settings {
        // find the most recent settings that was linked to the game
        let mut latest_action: Option<Action> = None;
        for (action,..) in link_details.into_inner() {
            match latest_action {
                Some(ref a) => if a.timestamp() < action.action().timestamp() {latest_action = Some(action.action().clone())}
                None => latest_action = Some(action.action().clone())
            }
        }
        // go and get the settings
        if let Some(action) = latest_action {
            match action {
                Action::CreateLink(create_link )=> {
                    let action_hash: ActionHash = create_link.target_address.into();
                    if let Some(details) = get_details(action_hash, GetOptions::default())? {
                        if let Some(game) = game_from_details(details)? {
                            games.push(game);
                        }
                    }
                }
                _ => ()
            }
        }
    }
    Ok(games)
}

#[hdk_extern]
fn get_game(game_entry_hash: EntryHashB64) -> ExternResult<GameOutput> {
    let entry_hash: EntryHash = game_entry_hash.into();
    let maybe_output = match get_details(entry_hash,GetOptions::default())? {
        Some(details) => game_from_details(details)?,
        None => None,
    };
    Ok(maybe_output.ok_or(wasm_error!(WasmErrorInner::Guest("Game not found".into())))?)
}

#[hdk_extern]
pub fn create_comment(input: CommentInput) -> ExternResult<CreateOutput> {
    let comment = Comment{comment: input.comment};
    let action_hash = create_entry(EntryTypes::Comment(comment.clone()))?;
    let hash: EntryHash = hash_entry(&comment)?;
    let entry_hash: EntryHash = input.entry_hash.into();
    create_link(AnyLinkableHash::from(entry_hash), AnyLinkableHash::from(hash.clone()), LinkTypes::Comment, ())?;

    Ok(CreateOutput{
        action_hash: action_hash.into(),
        entry_hash: hash.into()
    })
}

fn comment_from_details(details: Details) -> ExternResult<Option<CommentOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, actions, .. }) => {
            let comment: Comment = entry.try_into()?;
            let hash = hash_entry(&comment)?;
            let action = actions[0].clone();
            Ok(Some(CommentOutput {
                entry_hash: hash.into(),
                action_hash: action.as_hash().clone().into(),
                comment: comment.comment, 
                agent: action.action().author().clone().into(),
                timestamp: action.action().timestamp(),
            }))
        }
        _ => Ok(None),
    }
} 
fn get_comments_inner(base: EntryHash) -> ExternResult<Vec<CommentOutput>> {
    let links = get_links(base, LinkTypes::Comment, None)?;

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

    get_comments_inner(entry_hash.into())
}


#[hdk_extern]
pub fn create_bead(input: BeadInput) -> ExternResult<CreateOutput> {
    let action_hash = create_entry(EntryTypes::Bead(input.bead.clone()))?;
    let hash: EntryHash = hash_entry(&input.bead)?;
    let entry_hash: EntryHash = input.entry_hash.into();
    create_link(AnyLinkableHash::from(entry_hash), AnyLinkableHash::from(hash.clone()), LinkTypes::Bead, ())?;

    Ok(CreateOutput{
        action_hash: action_hash.into(),
        entry_hash: hash.into()
    })
}

fn bead_from_details(details: Details) -> ExternResult<Option<BeadOutput>> {
    match details {
        Details::Entry(EntryDetails { entry, actions, .. }) => {
            let bead: Bead = entry.try_into()?;
            let hash = hash_entry(&bead)?;
            let action = actions[0].clone();
            Ok(Some(BeadOutput {
                entry_hash: hash.into(),
                action_hash: action.as_hash().clone().into(),
                bead, 
                agent: action.action().author().clone().into(),
                timestamp: action.action().timestamp(),
            }))
        }
        _ => Ok(None),
    }
} 
fn get_beads_inner(base: EntryHash) -> ExternResult<Vec<BeadOutput>> {
    let links = get_links(base, LinkTypes::Bead, None)?;

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
    get_beads_inner(entry_hash.into())
}
