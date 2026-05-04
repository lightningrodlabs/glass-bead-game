pub use hdk::prelude::*;

pub mod game;
pub mod signals;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut fns = std::collections::HashSet::new();
    fns.insert((zome_info()?.name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: CapAccess::Unrestricted,
        functions: GrantedFunctions::Listed(fns),
    })?;

    Ok(InitCallbackResult::Pass)
}
