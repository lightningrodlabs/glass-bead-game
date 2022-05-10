/* eslint-disable camelcase */
export interface ISpace {
    id: number
    handle: string
    name: string
    description: string
    flagImagePath: string
    coverImagePath: string
    createdAt: string
    totalSpaces: number
    totalPosts: number
    totalUsers: number
    totalFollowers: number
    totalComments: number
    totalReactions: number
    totalLikes: number
    totalRatings: number
    // includes
    Creator: Partial<IUser>
    DirectChildHolons: Partial<ISpace[]>
    DirectParentHolons: Partial<ISpace[]>
    HolonHandles: { handle: string }[]
}

export interface IPost {
    id: number
    type: string
    subType: string
    text: string
    url: string | null
    urlDescription: string | null
    urlDomain: string | null
    urlImage: string | null
    urlTitle: string | null
    createdAt: string
    accountLike: number
    accountLink: number
    accountRating: number
    accountRepost: number
    totalComments: number
    totalLikes: number
    totalLinks: number
    totalRatingPoints: number
    totalRatings: number
    totalReactions: number
    totalReposts: number
    // includes (todo: capitalise)
    creator: Partial<IUser>
    spaces: Partial<ISpace[]>
    PollAnswers: IPollAnswer[]
    DirectSpaces: any[]
    IndirectSpaces: any[]
    Links: any[]
}

export interface IUser {
    id: number
    handle: string
    name: string
    bio: string
    unseenNotifications?: number
    coverImagePath: string
    flagImagePath: string
    createdAt: string
    totalPosts: number
    totalComments: number
    // includes
    FollowedHolons: Partial<ISpace[]>
    ModeratedHolons: Partial<ISpace[]>
}

export interface IComment {
    id: number
    text: string
}

export interface IPrism {
    id: number
    postId: number
    numberOfPlayers: number
    duration: string
    privacy: string
    createdAt: string
    // includes
    User: Partial<IUser>
}

export interface IPollAnswer {
    id: number
    value: number
    totalVotes: number
    totalScore: number
}

export interface ISpaceHighlights {
    TopPosts: IPost[]
    TopSpaces: ISpace[]
    TopUsers: IUser[]
}

export interface ISpaceMapData {
    id: number
    children: any
}

export interface IAccountContext {
    loggedIn: boolean
    accountData: any
    setAccountData: (payload: any) => void
    accountDataLoading: boolean
    setAccountDataLoading: (payload: boolean) => void
    // notifications: any[]
    // setNotifications: (payload: any[]) => void
    // notificationsLoading: boolean
    // modals (todo: most to be removed...)
    alertModalOpen: boolean
    setAlertModalOpen: (payload: boolean) => void
    alertMessage: string
    setAlertMessage: (payload: string) => void
    authModalOpen: boolean
    setAuthModalOpen: (payload: boolean) => void
    logInModalOpen: boolean
    setLogInModalOpen: (payload: boolean) => void
    registerModalOpen: boolean
    setRegisterModalOpen: (payload: boolean) => void
    forgotPasswordModalOpen: boolean
    setForgotPasswordModalOpen: (payload: boolean) => void
    navBarDropDownModalOpen: boolean
    setNavbarDropDownModalOpen: (payload: boolean) => void
    createCommentModalOpen: boolean
    setCreateCommentModalOpen: (payload: boolean) => void
    settingModalOpen: boolean
    setSettingModalOpen: (payload: boolean) => void
    settingModalType: string
    setSettingModalType: (payload: string) => void
    imageUploadModalOpen: boolean
    setImageUploadModalOpen: (payload: boolean) => void
    imageUploadType: string
    setImageUploadType: (payload: string) => void
    resetPasswordModalOpen: boolean
    setResetPasswordModalOpen: (payload: boolean) => void
    resetPasswordModalToken: string | null
    setResetPasswordModalToken: (payload: string | null) => void
    donateModalOpen: boolean
    setDonateModalOpen: (payload: boolean) => void
    // functions
    getAccountData: () => void
    updateAccountData: (key: string, payload: any) => void
    // getNotifications: () => void
    // updateAccountNotification: (id: number, key: string, payload: any) => void
    logOut: () => void
}

export interface ISpaceContext {
    spaceData: any
    setSpaceData: (payload: any) => void
    isFollowing: boolean
    setIsFollowing: (payload: boolean) => void
    isModerator: boolean
    selectedSpaceSubPage: string
    setSelectedSpaceSubPage: (payload: string) => void
    fullScreen: boolean
    setFullScreen: (payload: boolean) => void

    spaceNotFound: boolean
    spacePostsLoading: boolean
    setSpacePostsLoading: (payload: boolean) => void
    nextSpacePostsLoading: boolean
    spaceSpacesLoading: boolean
    setSpaceSpacesLoading: (payload: boolean) => void
    nextSpaceSpacesLoading: boolean
    spacePeopleLoading: boolean
    setSpacePeopleLoading: (payload: boolean) => void
    nextSpacePeopleLoading: boolean

    spacePosts: any[]
    setSpacePosts: (payload: any[]) => void
    totalMatchingPosts: number
    spacePostsFilters: any
    spacePostsPaginationLimit: number
    spacePostsPaginationOffset: number
    spacePostsPaginationHasMore: boolean

    spaceSpaces: any[] // ISpace[]
    setSpaceSpaces: (payload: any[]) => void
    spaceSpacesFilters: any
    spaceSpacesPaginationLimit: number
    spaceSpacesPaginationOffset: number
    spaceSpacesPaginationHasMore: boolean

    spacePeople: any[]
    spacePeopleFilters: any
    spacePeopleFiltersOpen: boolean
    setSpacePeopleFiltersOpen: (payload: boolean) => void
    spacePeoplePaginationLimit: number
    spacePeoplePaginationOffset: number
    spacePeoplePaginationHasMore: boolean

    getSpaceData: (handle: string, callback?: any) => void
    getSpacePosts: (handle: string, offset: number, limit: number) => void
    getSpaceSpaces: (handle: string, offset: number, limit: number) => void
    getSpacePeople: (handle: string, offset: number, limit: number) => void

    updateSpacePostsFilter: (key: string, payload: string) => void
    updateSpaceSpacesFilter: (key: string, payload: string) => void
    updateSpacePeopleFilter: (key: string, payload: string) => void
    resetSpaceData: () => void
    resetSpacePosts: () => void
    resetSpaceSpaces: () => void
    resetSpacePeople: () => void
}

export interface IPostContext {
    selectedSubPage: string
    setSelectedSubPage: (payload: string) => void
    postData: any
    postDataLoading: boolean
    // functions
    getPostData: (payload: number) => void
    resetPostContext: () => void
}

export interface IUserContext {
    isOwnAccount: boolean
    selectedUserSubPage: string
    setSelectedUserSubPage: (payload: string) => void
    userData: any // Partial<IUser>
    setUserData: (payload: any) => void
    userDataLoading: boolean
    userPosts: IPost[]
    setUserPosts: (payload: any) => void
    userPostsLoading: boolean
    nextUserPostsLoading: boolean
    userPostsFilters: any
    userPostsFiltersOpen: boolean
    setUserPostsFiltersOpen: (payload: boolean) => void
    userPostsPaginationLimit: number
    userPostsPaginationOffset: number
    userPostsPaginationHasMore: boolean
    // functions
    getUserData: (handle: string, returnFunction?: any) => void
    getUserPosts: (userId: number, offset: number) => void
    updateUserPostsFilter: (key: string, payload: string) => void
    resetUserData: () => void
    resetUserPosts: () => void
}
