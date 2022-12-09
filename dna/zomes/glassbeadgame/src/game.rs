pub use hdk::prelude::*;
use hdk::prelude::{holo_hash::{EntryHashB64, ActionHashB64, AgentPubKeyB64}};
use glassbeadgame_core::{Player, Game, Bead, Comment, EntryTypes, LinkTypes, GameSettings};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JoinGameInput {
    pub agent_key: AgentPubKeyB64,
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
pub struct GameOutput {
    pub entry_hash: EntryHashB64,
    pub creator: Player,
    pub settings: GameSettings,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateGameInput {
    pub entry_hash: EntryHashB64,
    pub new_settings: GameSettings
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentInput {
    pub entry_hash: EntryHashB64,
    pub text: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentOutput {
    pub action_hash: ActionHashB64,
    pub entry_hash: EntryHashB64,
    pub agent_key: AgentPubKeyB64,
    pub text: String,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommentWithPlayer {
    player: Player,
    text: String,
    timestamp: Timestamp,
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
    pub agent_key: AgentPubKeyB64,
    pub bead: Bead,
    pub timestamp: Timestamp,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BeadWithPlayer {
    player: Player,
    bead: Bead,
    timestamp: Timestamp,
}

#[hdk_extern]
pub fn save_player_details(player: Player) -> ExternResult<ActionHashB64> {
    // create player entry
    let action_hash = create_entry(EntryTypes::Player(player.clone()))?;
    // link to agent
    create_link(AnyLinkableHash::from(AgentPubKey::from(player.agent_key)), action_hash.clone(), LinkTypes::Player, ())?;

    Ok(action_hash.into())
}

fn player_from_details(details: Details) -> ExternResult<Option<Player>> {
    match details {
        Details::Record(RecordDetails { record, .. }) => {
            let player: Player = record.try_into()?;
            Ok(Some(player.clone()))
        }
        _ => Ok(None),
    }
} 

#[hdk_extern]
pub fn get_player_details(agent_key: AgentPubKey) -> ExternResult<Option<Player>> {
    let links = vec![GetLinksInput::new(agent_key.into(), LinkTypes::Player.try_into()?, None)];
    let link_details = HDK.with(|hdk| hdk.borrow().get_link_details(links))?;
    let mut player: Option<Player> = None;

    for link_detail in link_details {
        // find the latest action
        let mut latest_action: Option<Action> = None;
        for (action,..) in link_detail.into_inner() {
            match latest_action {
                Some(ref a) => if a.timestamp() < action.action().timestamp() { latest_action = Some(action.action().clone()) }
                None => latest_action = Some(action.action().clone())
            }
        }
        // get player details from latest action
        if let Some(action) = latest_action {
            match action {
                Action::CreateLink(create_link )=> {
                    let action_hash: ActionHash = create_link.target_address.clone().into();
                    if let Some(details) = get_details(action_hash.clone(), GetOptions::default())? {
                        if let Some(player_data) = player_from_details(details)? {
                            player = Some(player_data);
                        }
                    }
                }
                _ => ()
            }
        }
    }

    Ok(player)
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
    // link games path to game
    create_link(path.path_entry_hash()?, hash.clone(), LinkTypes::Game, ())?;
    // link game to settings
    create_link(hash.clone(), settings_action_hash.clone(), LinkTypes::Settings, ())?;

    Ok(CreateGameOutput{
        action_hash: action_hash.into(),
        settings_action_hash: settings_action_hash.into(),
        entry_hash: hash.into()
    })
}

#[hdk_extern]
pub fn update_game(input: UpdateGameInput) -> ExternResult<ActionHashB64> {
    let settings_action_hash = create_entry(EntryTypes::GameSettings(input.new_settings.clone()))?;
    create_link(input.entry_hash, settings_action_hash.clone(), LinkTypes::Settings, ())?;

    Ok(settings_action_hash.into())
}

#[hdk_extern]
pub fn join_game(input: JoinGameInput) -> ExternResult<ActionHashB64> {
    let entry_hash: EntryHash = input.entry_hash.into();
    let action_hash  = create_link(AnyLinkableHash::from(entry_hash),AnyLinkableHash::from(AgentPubKey::from(input.agent_key)), LinkTypes::Player, ())?;
    Ok(action_hash.into())
}

#[hdk_extern]
pub fn get_players(game_hash: EntryHashB64) -> ExternResult<Vec<Player>> {
    let hash : EntryHash = game_hash.into();
    let links = get_links(AnyLinkableHash::from(hash), LinkTypes::Player, None)?;
    let mut players: Vec<Player> = vec![];
    for link in links {
        let agent: EntryHash = EntryHash::try_from(link.target)?; // gotta go through an agent hash because can't get there direct yet!
        let agent_key: AgentPubKey = AgentPubKey::try_from(agent)?;
        if let Some(player) = get_player_details(agent_key.clone().into())? {
            players.push(player);
        }
    }

    Ok(players)
}

#[hdk_extern]
pub fn leave_game(input: ActionHashB64) -> ExternResult<ActionHashB64> {
    let action_hash = delete_link(input.into())?;
    Ok(action_hash.into())
}

#[hdk_extern]
pub fn get_games(_: ()) -> ExternResult<Vec<GameOutput>> {
    let path = Path::from("games".to_string());
    // get links to games
    let game_links = get_links(path.path_entry_hash()?, LinkTypes::Game, None)?;
    // gather settings inputs for each game
    let mut inputs = vec![];
    for link in game_links {
        inputs.push(GetLinksInput::new(link.target.into(), LinkTypes::Settings.try_into()?, None))
    }

    get_latest_game_settings(inputs)
}

fn game_from_details(creator: Player, details: Details, game_entry_hash: EntryHashB64) -> ExternResult<Option<GameOutput>> {
    match details {
        Details::Record(RecordDetails { record, .. }) => {
            let settings: GameSettings = record.try_into()?;
            Ok(Some(GameOutput {
                entry_hash: game_entry_hash.into(),
                creator,
                settings,
            }))
        }
        _ => Ok(None),
    }
}

fn get_latest_game_settings(inputs: Vec<GetLinksInput>) -> ExternResult<Vec<GameOutput>> {
    let all_settings = HDK.with(|hdk| hdk.borrow().get_link_details(inputs))?;
    let mut games: Vec<GameOutput> = vec![];

    for link_details in all_settings {
        // find game creator
        let (first_action,..) = link_details.clone().into_inner()[0].clone();
        let creator = get_player_details(first_action.action().author().clone())?;
        if let Some(creator) = creator {
            // find the most recent linked settings
            let mut latest_action: Option<Action> = None;
            for (action,..) in link_details.into_inner() {
                match latest_action {
                    Some(ref a) => if a.timestamp() < action.action().timestamp() { latest_action = Some(action.action().clone()) }
                    None => latest_action = Some(action.action().clone())
                }
            }
            // get the settings data
            if let Some(action) = latest_action {
                match action {
                    Action::CreateLink(create_link )=> {
                        let settings_action_hash: ActionHash = create_link.target_address.clone().into();
                        let game_entry_hash: EntryHash = create_link.base_address.clone().into();
                        if let Some(details) = get_details(settings_action_hash.clone(), GetOptions::default())? {
                            if let Some(game) = game_from_details(creator, details, game_entry_hash.into())? {
                                games.push(game);
                            }
                        }
                    }
                    _ => ()
                }
            }
        }
    }

    Ok(games)
}

#[hdk_extern]
fn get_game(game_entry_hash: EntryHashB64) -> ExternResult<GameOutput> {
    let inputs = vec![GetLinksInput::new(game_entry_hash.into(), LinkTypes::Settings.try_into()?, None)];
    let games = get_latest_game_settings(inputs).unwrap();
    let game: Option<GameOutput> = Some(games[0].clone());

    Ok(game.ok_or(wasm_error!(WasmErrorInner::Guest("Game not found".into())))?)
}

#[hdk_extern]
pub fn create_comment(input: CommentInput) -> ExternResult<CreateOutput> {
    let comment = Comment{text: input.text};
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
                text: comment.text,
                agent_key: action.action().author().clone().into(),
                timestamp: action.action().timestamp(),
            }))
        }
        _ => Ok(None),
    }
}

fn get_comments_inner(base: EntryHash) -> ExternResult<Vec<CommentWithPlayer>> {
    let links = get_links(base, LinkTypes::Comment, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(EntryHash::from(link.target).into(), GetOptions::default()))
        .collect();

    let comment_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let comments_with_details: Vec<CommentOutput> = comment_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| comment_from_details(details).ok()?)
        .collect();

    let mut comments: Vec<CommentWithPlayer> = vec![];
    for comment in comments_with_details.clone() {
        if let Some(player) = get_player_details(comment.clone().agent_key.into())? {
            let comment_with_player = CommentWithPlayer { player, text: comment.text, timestamp: comment.timestamp };
            comments.push(comment_with_player);
        }
    }

    Ok(comments)
}

#[hdk_extern]
pub fn get_comments(entry_hash: EntryHashB64) -> ExternResult<Vec<CommentWithPlayer>> {
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
                agent_key: action.action().author().clone().into(),
                timestamp: action.action().timestamp(),
            }))
        }
        _ => Ok(None),
    }
}

fn get_beads_inner(base: EntryHash) -> ExternResult<Vec<BeadWithPlayer>> {
    let links = get_links(base, LinkTypes::Bead, None)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(EntryHash::from(link.target).into(), GetOptions::default()))
        .collect();

    let bead_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let beads_with_details: Vec<BeadOutput> = bead_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| bead_from_details(details).ok()?)
        .collect();

    let mut beads: Vec<BeadWithPlayer> = vec![];
    for bead in beads_with_details.clone() {
        if let Some(player) = get_player_details(bead.clone().agent_key.into())? {
            let bead_with_player = BeadWithPlayer { player, bead: bead.bead, timestamp: bead.timestamp };
            beads.push(bead_with_player);
        }
    }
    
    Ok(beads)
}

#[hdk_extern]
pub fn get_beads(entry_hash: EntryHashB64) -> ExternResult<Vec<BeadWithPlayer>> {
    get_beads_inner(entry_hash.into())
}
