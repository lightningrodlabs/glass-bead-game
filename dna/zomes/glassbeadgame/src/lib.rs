pub use hdk::prelude::*;

pub mod game;

entry_defs![
    PathEntry::entry_def(),
    Anchor::entry_def(),
    game::Comment::entry_def(),
    game::Game::entry_def()
    ];

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;

    Ok(InitCallbackResult::Pass)
}