pub use hdk::prelude::*;

const USER_ANCHOR_TYPE: &str = "user";
const USER_ANCHOR_TEXT: &str = "user";

#[hdk_entry(id = "user")]
#[derive(Clone)]
pub struct User {
    pub handle : String,
    pub name: String,
    pub email: String,
    pub password: String,
    pub bio: String,
    pub flag_image_path: String,
    pub cover_image_path: String,
    pub facebook_id: String,
    pub email_verified: bool
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UserInput {
    pub handle: String,
    pub name: String,
    pub email: String,
    pub password: String
}

#[hdk_extern]
pub fn register(input: UserInput) -> ExternResult<String> {
    let users: Vec<User> = get_all_users()?;
    for u in users {
        if u.handle.eq(&input.handle) {
            return Ok("Handle already taken".to_string());
        } else if u.email.eq(&input.email) {
            return Ok("Email already taken".to_string());
        }
    }

    let user: User = User {
        handle : input.handle,
        name : input.name,
        email: input.email,
        password: input.password,
        bio: "".to_string(),
        flag_image_path: "".to_string(),
        cover_image_path: "".to_string(),
        facebook_id: "".to_string(),
        email_verified: true
    };

    let anchor = anchor(USER_ANCHOR_TYPE.into(), USER_ANCHOR_TEXT.into())?;

    let user_header = create_entry(&user)?;
    let hash: EntryHash = hash_entry(&user)?;

    create_link(anchor.into_hash(), hash, ())?;

    Ok(user_header.to_string())
}

fn _return_user(link: Link) -> ExternResult<User> {
    let element: Element = get(link.target, GetOptions::default())?
        .ok_or(WasmError::Guest(String::from("Entry not found")))?;
    let entry_option: Option<User> = element.entry().to_app_option()?;
    let entry: User =
        entry_option.ok_or(WasmError::Guest("The targeted entry is not a user".into()))?;

    Ok(entry)
}

fn get_all_users() -> ExternResult<Vec<User>> {
    let anchor = anchor(USER_ANCHOR_TYPE.into(), USER_ANCHOR_TEXT.into())?;
    let mut users: Vec<User> = Vec::new();

    let links = get_links(anchor.into_hash(), None)?;

    for l in links {
        users.push(_return_user(l)?);
    }

    Ok(users)
}

#[hdk_extern]
pub fn login(input : UserInput) -> ExternResult<User> {
    let users: Vec<User> = get_all_users()?;

    for u in users {
        if (u.handle.eq(&input.handle) || u.email.eq(&input.email)) && u.password.eq(&input.password) {
            return Ok(u);
        }
    }
    Err(WasmError::Guest(String::from("user not found")))
}

#[hdk_extern]
pub fn update_password(input: UserInput) -> ExternResult<String> {
    let anchor = anchor(USER_ANCHOR_TYPE.into(), USER_ANCHOR_TEXT.into())?;

    let links = get_links(anchor.clone().into_hash(), None)?;

    for l in links {
        let element: Element = get(l.target, GetOptions::default())?
            .ok_or(WasmError::Guest(String::from("Entry not found")))?;
        let entry_option: Option<User> = element.entry().to_app_option()?;
        let entry: User =
            entry_option.ok_or(WasmError::Guest("The targeted entry is not a user".into()))?;

        if entry.handle.eq(&input.handle) {
            let header_hash = element.header_hashed().as_hash();
            let user: User = User {
                handle: entry.handle,
                name : entry.name,
                email: entry.email,
                password: input.password,
                bio: entry.bio,
                flag_image_path: entry.flag_image_path,
                cover_image_path: entry.cover_image_path,
                facebook_id: entry.facebook_id,
                email_verified: entry.email_verified
            };
            let user_header = update_entry(header_hash.clone(), &user)?;
            delete_link(l.create_link_hash)?;

            let hash: EntryHash = hash_entry(&user)?;
            create_link(anchor.into_hash(), hash, ())?;
            return Ok(user_header.to_string());
        }
    }

    Err(WasmError::Guest(String::from("user not found")))
}

#[hdk_extern]
pub fn get_users(_: ()) -> ExternResult<Vec<User>> {
    let anchor = anchor(USER_ANCHOR_TYPE.into(), USER_ANCHOR_TEXT.into())?;
    let mut users: Vec<User> = Vec::new();

    let links = get_links(anchor.into_hash(), None)?;

    for l in links {
        users.push(_return_user(l)?);
    }

    Ok(users)

    // let anchor = anchor(USER_ANCHOR_TYPE.into(), USER_ANCHOR_TEXT.into())?;
    // let mut Users: Vec<User> = Vec::new();

    // let links = get_links(anchor.into_hash(), None)?;

    // for l in links {
    //     let element: Element = get(l.target, GetOptions::default())?.ok_or(WasmError::Guest(String::from("Entry not found")))?;
    //     let header = element.header();
    //     headers.push(header.clone());
    // }

    // Ok(headers)

    // let mut headers: Vec<Header> = Vec::new();
    // let filter = ChainQueryFilter::new();
    // let elements = query(filter)?;
    // for e in elements {
    //     headers.push(e.header().clone());
    // }
    // Ok(headers)
}