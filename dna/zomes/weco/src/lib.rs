pub use hdk::prelude::*;

pub mod user;
pub mod game;
pub mod post;
pub mod room;

entry_defs![Anchor::entry_def(),
    user::User::entry_def(),
    game::Game::entry_def(),
    post::Post::entry_def(),
    room::Room::entry_def()];

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "receive_notification".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;

    Ok(InitCallbackResult::Pass)
}