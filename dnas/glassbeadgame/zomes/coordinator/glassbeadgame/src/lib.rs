pub use hdk::prelude::*;

pub mod game;
pub mod signals;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut fns = BTreeSet::new();
    fns.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions: GrantedFunctions::Listed(fns),
    })?;

    Ok(InitCallbackResult::Pass)
}