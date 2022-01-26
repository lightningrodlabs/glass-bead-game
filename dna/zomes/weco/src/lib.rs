use hc_file_storage_types::*;
use hdk::prelude::*;

pub mod room;
pub mod file_storage;

entry_defs![Anchor::entry_def(),
    room::Room::entry_def(),
    FileChunk::entry_def(),
    FileMetadata::entry_def()];

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
