pub use hdk::prelude::*;

use glassbeadgame_integrity::{Bead, Comment, EntryTypes, Game, GameSettings, LinkTypes};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JoinGameInput {
    pub agent_key: AgentPubKey,
    pub entry_hash: EntryHash,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateGameOutput {
    pub action_hash: ActionHash,
    pub settings_action_hash: ActionHash,
    pub entry_hash: EntryHash,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutput {
    pub action_hash: ActionHash,
    pub entry_hash: EntryHash,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GameOutput {
    pub entry_hash: EntryHash,
    pub creator: AgentPubKey,
    pub settings: GameSettings,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGameInput {
    pub entry_hash: EntryHash,
    pub new_settings: GameSettings,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentInput {
    pub entry_hash: EntryHash,
    pub text: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentOutput {
    pub action_hash: ActionHash,
    pub entry_hash: EntryHash,
    pub agent_key: AgentPubKey,
    pub text: String,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadInput {
    pub entry_hash: EntryHash,
    pub bead: Bead,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadOutput {
    pub action_hash: ActionHash,
    pub entry_hash: EntryHash,
    pub agent_key: AgentPubKey,
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
    let game = Game { id: settings_action_hash.clone() };
    let action_hash = create_entry(EntryTypes::Game(game.clone()))?;
    let hash: EntryHash = hash_entry(&game)?;
    let path = get_game_path(&game)?;
    create_link(path.path_entry_hash()?, hash.clone(), LinkTypes::Game, ())?;
    create_link(hash.clone(), settings_action_hash.clone(), LinkTypes::Settings, ())?;

    Ok(CreateGameOutput {
        action_hash,
        settings_action_hash,
        entry_hash: hash,
    })
}

#[hdk_extern]
pub fn update_game(input: UpdateGameInput) -> ExternResult<ActionHash> {
    let settings_action_hash = create_entry(EntryTypes::GameSettings(input.new_settings.clone()))?;
    create_link(input.entry_hash, settings_action_hash.clone(), LinkTypes::Settings, ())?;

    Ok(settings_action_hash)
}

#[hdk_extern]
pub fn join_game(input: JoinGameInput) -> ExternResult<ActionHash> {
    let action_hash = create_link(
        input.entry_hash,
        input.agent_key,
        LinkTypes::Player,
        (),
    )?;
    Ok(action_hash)
}

#[hdk_extern]
pub fn get_players(game_hash: EntryHash) -> ExternResult<Vec<AgentPubKey>> {
    let links = get_links(
        LinkQuery::try_new(game_hash, LinkTypes::Player)?,
        GetStrategy::Network,
    )?;
    let mut players: Vec<AgentPubKey> = vec![];
    for link in links {
        if let Ok(agent_key) = AgentPubKey::try_from(link.target) {
            players.push(agent_key);
        }
    }
    Ok(players)
}

#[hdk_extern]
pub fn leave_game(input: ActionHash) -> ExternResult<ActionHash> {
    let action_hash = delete_link(input, GetOptions::network())?;
    Ok(action_hash)
}

#[hdk_extern]
pub fn get_games(_: ()) -> ExternResult<Vec<GameOutput>> {
    let path = Path::from("games".to_string());
    let game_links = get_links(
        LinkQuery::try_new(path.path_entry_hash()?, LinkTypes::Game)?,
        GetStrategy::Network,
    )?;
    let mut games: Vec<GameOutput> = vec![];
    for link in game_links {
        let game_entry_hash: EntryHash = match link.target.try_into() {
            Ok(h) => h,
            Err(_) => continue,
        };
        if let Some(output) = get_game_inner(game_entry_hash)? {
            games.push(output);
        }
    }
    Ok(games)
}

fn get_game_inner(game_entry_hash: EntryHash) -> ExternResult<Option<GameOutput>> {
    // get the game record so we know the creator
    let game_record = match get(game_entry_hash.clone(), GetOptions::network())? {
        Some(r) => r,
        None => return Ok(None),
    };
    let creator: AgentPubKey = game_record.action().author().clone();

    // most-recent settings via newest active link
    let settings_links = get_links(
        LinkQuery::try_new(game_entry_hash.clone(), LinkTypes::Settings)?,
        GetStrategy::Network,
    )?;
    let latest = settings_links.into_iter().max_by_key(|l| l.timestamp);
    let Some(latest) = latest else { return Ok(None) };
    let settings_action_hash: ActionHash = latest.target.try_into()
        .map_err(|e| wasm_error!("settings link target not an action hash: {:?}", e))?;
    let Some(record) = get(settings_action_hash, GetOptions::network())? else {
        return Ok(None);
    };
    let settings: GameSettings = match record.entry().to_app_option() {
        Ok(Some(s)) => s,
        _ => return Ok(None),
    };
    Ok(Some(GameOutput {
        entry_hash: game_entry_hash,
        creator,
        settings,
    }))
}

#[hdk_extern]
fn get_game(game_entry_hash: EntryHash) -> ExternResult<GameOutput> {
    get_game_inner(game_entry_hash)?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Game not found".into())))
}

#[hdk_extern]
pub fn create_comment(input: CommentInput) -> ExternResult<CreateOutput> {
    let comment = Comment { text: input.text };
    let action_hash = create_entry(EntryTypes::Comment(comment.clone()))?;
    let hash: EntryHash = hash_entry(&comment)?;
    create_link(input.entry_hash, hash.clone(), LinkTypes::Comment, ())?;

    Ok(CreateOutput {
        action_hash,
        entry_hash: hash,
    })
}

#[hdk_extern]
pub fn get_comments(entry_hash: EntryHash) -> ExternResult<Vec<CommentOutput>> {
    let links = get_links(
        LinkQuery::try_new(entry_hash, LinkTypes::Comment)?,
        GetStrategy::Network,
    )?;
    let mut comments: Vec<CommentOutput> = vec![];
    for link in links {
        let target_hash: AnyDhtHash = match link.target.try_into() {
            Ok(h) => h,
            Err(_) => continue,
        };
        let Some(record) = get(target_hash, GetOptions::network())? else { continue };
        let comment: Comment = match record.entry().to_app_option() {
            Ok(Some(c)) => c,
            _ => continue,
        };
        let entry_hash: EntryHash = hash_entry(&comment)?;
        comments.push(CommentOutput {
            action_hash: record.action_address().clone(),
            entry_hash,
            agent_key: record.action().author().clone(),
            text: comment.text,
            timestamp: record.action().timestamp(),
        });
    }
    Ok(comments)
}

#[hdk_extern]
pub fn create_bead(input: BeadInput) -> ExternResult<CreateOutput> {
    let action_hash = create_entry(EntryTypes::Bead(input.bead.clone()))?;
    let hash: EntryHash = hash_entry(&input.bead)?;
    create_link(input.entry_hash, hash.clone(), LinkTypes::Bead, ())?;

    Ok(CreateOutput {
        action_hash,
        entry_hash: hash,
    })
}

#[hdk_extern]
pub fn get_beads(entry_hash: EntryHash) -> ExternResult<Vec<BeadOutput>> {
    let links = get_links(
        LinkQuery::try_new(entry_hash, LinkTypes::Bead)?,
        GetStrategy::Network,
    )?;
    let mut beads: Vec<BeadOutput> = vec![];
    for link in links {
        let target_hash: AnyDhtHash = match link.target.try_into() {
            Ok(h) => h,
            Err(_) => continue,
        };
        let Some(record) = get(target_hash, GetOptions::network())? else { continue };
        let bead: Bead = match record.entry().to_app_option() {
            Ok(Some(b)) => b,
            _ => continue,
        };
        let entry_hash: EntryHash = hash_entry(&bead)?;
        beads.push(BeadOutput {
            action_hash: record.action_address().clone(),
            entry_hash,
            agent_key: record.action().author().clone(),
            bead,
            timestamp: record.action().timestamp(),
        });
    }
    Ok(beads)
}
