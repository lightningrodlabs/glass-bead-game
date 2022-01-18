pub use hdk::prelude::*;

const ROOM_ANCHOR_TYPE: &str = "room";
const ROOM_ANCHOR_TEXT: &str = "room";

#[hdk_entry(id = "room")]
#[derive(Clone)]
pub struct Room {
    name : String,
    users : Vec<RoomUser>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct RoomUser {
    name : String,
    agent : AgentPubKey
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RoomUserInput {
    room_name : String,
    room_user : RoomUser
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RoomInput {
    room_name : String
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MessageInput {
    room_name : String,
    user_name : String,
    message : String
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NotificationInput {
    message : String
}

#[hdk_extern]
pub fn create_room(input: RoomInput) -> ExternResult<String> {
    // create new Room entry
    let room: Room = Room {
        name : input.room_name,
        users : Vec::new()
    };

    let anchor = anchor(ROOM_ANCHOR_TYPE.into(), ROOM_ANCHOR_TEXT.into())?;

    let _header_hash = create_entry(&room)?;
    let hash: EntryHash = hash_entry(&room)?;

    create_link(anchor.into_hash(), hash, ())?;

    Ok(String::from("Success"))
}

#[hdk_extern]
pub fn join_room(input: RoomUserInput) -> ExternResult<String> {
    let anchor = anchor(ROOM_ANCHOR_TYPE.into(), ROOM_ANCHOR_TEXT.into())?;
    let links = get_links(anchor.clone().into_hash(), None)?;

    for l in links {
        let element: Element = get(l.target, GetOptions::default())?
            .ok_or(WasmError::Guest(String::from("Entry not found")))?;
        let entry_option: Option<Room> = element.entry().to_app_option()?;
        let entry: Room =
            entry_option.ok_or(WasmError::Guest("The targeted entry is not a room".into()))?;

        if entry.name.eq(&input.room_name) {
            let mut users = entry.users;
            users.push(input.room_user.clone());

            let room : Room = Room {
                name : entry.name,
                users : users
            };

            let header_hash = element.header_hashed().as_hash();
            let _room_header = update_entry(header_hash.clone(), &room)?;
            delete_link(l.create_link_hash)?;

            let hash: EntryHash = hash_entry(&room)?;
            create_link(anchor.into_hash(), hash, ())?;
            return Ok(String::from("Success"));
        }
    }
    Err(WasmError::Guest(String::from("room not found")))
}

#[hdk_extern]
pub fn leave_room(input: RoomUserInput) -> ExternResult<String> {
    let anchor = anchor(ROOM_ANCHOR_TYPE.into(), ROOM_ANCHOR_TEXT.into())?;
    let links = get_links(anchor.clone().into_hash(), None)?;

    for l in links {
        let element: Element = get(l.target, GetOptions::default())?
            .ok_or(WasmError::Guest(String::from("Entry not found")))?;
        let entry_option: Option<Room> = element.entry().to_app_option()?;
        let entry: Room =
            entry_option.ok_or(WasmError::Guest("The targeted entry is not a room".into()))?;

        if entry.name.eq(&input.room_name) {
            let mut users = entry.users;

            let index = users.iter().position(|x| (*x.name).eq(&input.room_user.name)).unwrap();
            users.remove(index);

            let room : Room = Room {
                name : entry.name,
                users : users
            };

            let header_hash = element.header_hashed().as_hash();
            let _room_header = update_entry(header_hash.clone(), &room)?;
            delete_link(l.create_link_hash)?;

            let hash: EntryHash = hash_entry(&room)?;
            create_link(anchor.into_hash(), hash, ())?;
            return Ok(String::from("Success"));
        }
    }
    Err(WasmError::Guest(String::from("room not found")))
}

#[hdk_extern]
pub fn get_rooms(_: ()) -> ExternResult<Vec<Room>> {
    let anchor = anchor(ROOM_ANCHOR_TYPE.into(), ROOM_ANCHOR_TEXT.into())?;
    let mut rooms: Vec<Room> = Vec::new();

    let links = get_links(anchor.into_hash(), None)?;

    for l in links {
        rooms.push(_return_room(l)?);
    }

    Ok(rooms)
}

fn _return_room(link: Link) -> ExternResult<Room> {
    let element: Element = get(link.target, GetOptions::default())?
        .ok_or(WasmError::Guest(String::from("Entry not found")))?;
    let entry_option: Option<Room> = element.entry().to_app_option()?;
    let entry: Room =
        entry_option.ok_or(WasmError::Guest("The targeted entry is not a user".into()))?;

    Ok(entry)
}

#[hdk_extern]
pub fn send_notification(input: MessageInput) -> ExternResult<String> {
    let anchor = anchor(ROOM_ANCHOR_TYPE.into(), ROOM_ANCHOR_TEXT.into())?;
    let links = get_links(anchor.clone().into_hash(), None)?;

    for l in links {
        let element: Element = get(l.target, GetOptions::default())?
            .ok_or(WasmError::Guest(String::from("Entry not found")))?;
        let entry_option: Option<Room> = element.entry().to_app_option()?;
        let entry: Room =
            entry_option.ok_or(WasmError::Guest("The targeted entry is not a room".into()))?;

        if entry.name.eq(&input.room_name) {
            let room_users: Vec<RoomUser> = entry.users.clone();
            for u in room_users {
                if u.name.eq(&input.user_name) {
                    continue;
                }
                call_remote(
                    u.agent.clone(),
                    zome_info()?.name,
                    "receive_notification".into(),
                    None,
                    NotificationInput {
                        message : input.message.clone(),
                    },
                )?;
            }
        }
    }

    Ok(String::from("success"))
}

#[hdk_extern]
pub fn receive_notification(input: NotificationInput) -> ExternResult<()> {
    Ok(emit_signal(input)?)
}
