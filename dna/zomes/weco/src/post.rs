pub use hdk::prelude::*;

const POST_ANCHOR_TYPE: &str = "post";
const POST_ANCHOR_TEXT: &str = "post";

#[hdk_entry(id = "post")]
#[derive(Clone)]
pub struct Post {
    pub ptype : String,
    pub state : String,
    pub creator : String,
    pub ptext : String,
    pub url : String,
    pub url_image : String,
    pub url_domain : String,
    pub url_title : String,
    pub url_description : String,
    pub created_at : String,
    pub updated_at : String
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PostCreateInput {
    pub ptype: String,
    pub creator: String,
    pub ptext: String,
    pub current_time: String
}

#[hdk_extern]
pub fn create_post(input: PostCreateInput) -> ExternResult<String> {
    let post: Post = Post {
        ptype : input.ptype,
        state : String::from("visible"),
        creator : input.creator,
        ptext : input.ptext,
        url : String::from(""),
        url_image : String::from(""),
        url_domain : String::from(""),
        url_title : String::from(""),
        url_description : String::from(""),
        created_at : input.current_time.clone(),
        updated_at : input.current_time
    };

    let anchor = anchor(POST_ANCHOR_TYPE.into(), POST_ANCHOR_TEXT.into())?;

    let _user_header = create_entry(&post)?;
    let hash: EntryHash = hash_entry(&post)?;

    create_link(anchor.into_hash(), hash, ())?;

    Ok(String::from("Success"))
}

