/* eslint-disable no-param-reassign */
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'universal-cookie'

import { SpaceContext } from '@contexts/SpaceContext'
import { AccountContext } from '@contexts/AccountContext'
import config from '@src/Config'
import styles from '@styles/components/CreatePostModal.module.scss'
import Modal from '@components/Modal'
import Column from '@components/Column'
import Row from '@components/Row'
import Input from '@components/Input'
import Button from '@components/Button'
import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'
import DropDownMenu from '@components/DropDownMenu'
import SearchSelector from '@components/SearchSelector'
import ImageTitle from '@components/ImageTitle'
import CloseButton from '@components/CloseButton'
import PostCard from '@components/Cards/PostCard/PostCard'
import { allValid, defaultErrorState } from '@src/Functions'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'

// todo: create custom regex and add to @src/Functions
function isValidUrl(string) {
    try {
        new URL(string)
    } catch (_) {
        return false
    }
    return true
}

const CreatePostModal = (): JSX.Element => {
    // todo: set create post modal open in page instead of account context
    const { setCreatePostModalOpen, accountData } = useContext(AccountContext)
    const { spaceData, spacePosts, setSpacePosts } = useContext(SpaceContext)
    const [formData, setFormData] = useState({
        postType: {
            value: 'Text',
            ...defaultErrorState,
        },
        text: {
            value: '',
            ...defaultErrorState,
        },
        url: {
            value: '',
            ...defaultErrorState,
        },
        topic: {
            value: '',
            ...defaultErrorState,
        },
    })
    const { postType, text, url, topic } = formData
    const [spaceOptions, setSpaceOptions] = useState<any[]>([])
    const [selectedSpaces, setSelectedSpaces] = useState<any[]>([])
    const [topicOptions, setTopicOptions] = useState<any[]>([])
    const [selectedArchetopic, setSelectedArchetopic] = useState<any>(null)
    const [urlLoading, setUrlLoading] = useState(false)
    const [urlImage, setUrlImage] = useState(null)
    const [urlDomain, setUrlDomain] = useState(null)
    const [urlTitle, setUrlTitle] = useState(null)
    const [urlDescription, setUrlDescription] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [previewRenderKey, setPreviewRenderKey] = useState(0)
    const cookies = new Cookies()

    function updateValue(name, value) {
        let resetState = {}
        if (name === 'postType') {
            resetState = {
                text: { ...formData.text, state: 'default' },
                url: { ...formData.url, value: '', state: 'default' },
                topic: { ...formData.topic, value: '', state: 'default' },
            }
            setUrlImage(null)
            setUrlDomain(null)
            setUrlTitle(null)
            setUrlDescription(null)
            setSelectedArchetopic(null)
        }
        setFormData({
            ...formData,
            [name]: { ...formData[name], value, state: 'default' },
            ...resetState,
        })
        setPreviewRenderKey((k) => k + 1)
    }

    function findSpaces(query) {
        if (!query) setSpaceOptions([])
        else {
            const blacklist = [spaceData.id, ...selectedSpaces.map((s) => s.id)]
            const data = { query, blacklist }
            axios
                .post(`${config.apiURL}/viable-post-spaces`, data)
                .then((res) => setSpaceOptions(res.data))
                .catch((error) => console.log(error))
        }
    }

    function addSpace(space) {
        setSpaceOptions([])
        setSelectedSpaces((s) => [...s, space])
        setPreviewRenderKey((k) => k + 1)
    }

    function removeSpace(spaceId) {
        setSelectedSpaces((s) => [...s.filter((space) => space.id !== spaceId)])
    }

    function findTopics(query) {
        const filteredTopics = GlassBeadGameTopics.filter((t) =>
            t.name.toLowerCase().includes(query.toLowerCase())
        )
        setTopicOptions(filteredTopics)
        updateValue('topic', query)
    }

    function selectTopic(selectedTopic) {
        setTopicOptions([])
        setSelectedArchetopic(selectedTopic)
        updateValue('topic', selectedTopic.name)
    }

    const scrapeURL = (urlString: string): void => {
        // set up better url regex
        if (isValidUrl(urlString)) {
            setUrlLoading(true)
            axios
                .get(`${config.apiURL}/scrape-url?url=${urlString}`)
                .then((res) => {
                    const { description, domain, image, title } = res.data
                    setUrlDescription(description)
                    setUrlDomain(domain)
                    setUrlImage(image)
                    setUrlTitle(title)
                    setUrlLoading(false)
                    setPreviewRenderKey((k) => k + 1)
                })
                .catch((error) => console.log(error))
        } else {
            console.log('invalid Url')
            // setUrlFlashMessage('invalid Url')
        }
    }

    function createPost(e) {
        e.preventDefault()
        // add validation with latest values to form data (is there a way around this?)
        const newFormData = {
            postType: {
                ...postType,
                required: false,
            },
            text: {
                ...text,
                required: postType.value !== 'Url',
                validate: (v) => {
                    const errors: string[] = []
                    if (!v) errors.push('Required')
                    if (v.length > 5000) errors.push('Must be less than 5K characters')
                    return errors
                },
            },
            url: {
                ...url,
                required: postType.value === 'Url',
                validate: (v) => (!isValidUrl(v) ? ['Must be a valid URL'] : []),
            },
            topic: {
                ...topic,
                required: postType.value === 'Glass Bead Game',
                validate: (v) => (!selectedArchetopic && !v ? ['Required'] : []),
            },
        }
        if (allValid(newFormData, setFormData)) {
            setLoading(true)
            const postData = {
                type: postType.value.replace(/\s+/g, '-').toLowerCase(),
                text: text.value,
                url: url.value,
                urlImage,
                urlDomain,
                urlTitle,
                urlDescription,
                topic: selectedArchetopic ? selectedArchetopic.name : topic.value,
                spaceHandles: [...selectedSpaces.map((s) => s.handle), spaceData.handle],
            }
            const accessToken = cookies.get('accessToken')
            const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } }
            axios
                .post(`${config.apiURL}/create-post`, postData, authHeader)
                .then((res) => {
                    setLoading(false)
                    setSaved(true)
                    // todo: update direct spaces
                    const DirectSpaces = [spaceData, ...selectedSpaces]
                    DirectSpaces.forEach((s) => {
                        s.type = 'post'
                        s.state = 'active'
                    })
                    const newPost = {
                        ...res.data,
                        total_comments: 0,
                        total_reactions: 0,
                        creator: {
                            handle: accountData.handle,
                            name: accountData.name,
                            flagImagePath: accountData.flagImagePath,
                        },
                        DirectSpaces,
                        GlassBeadGame: { topic: topic.value },
                    }
                    setSpacePosts([newPost, ...spacePosts])
                    setTimeout(() => setCreatePostModalOpen(false), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    const postTypeName = ['Text', 'Url'].includes(postType.value)
        ? `${postType.value.toLowerCase()} post`
        : postType.value

    return (
        <Modal close={() => setCreatePostModalOpen(false)} centered>
            <h1>
                Create a new {postTypeName} in{' '}
                <Link to={`/s/${spaceData.handle}`} onClick={() => setCreatePostModalOpen(false)}>
                    {spaceData.name}
                </Link>
            </h1>

            <form onSubmit={createPost}>
                <Column style={{ width: 700 }}>
                    <DropDownMenu
                        title='Post Type'
                        options={['Text', 'Url', 'Glass Bead Game']}
                        selectedOption={postType.value}
                        setSelectedOption={(value) => updateValue('postType', value)}
                        orientation='horizontal'
                        style={{ marginBottom: 10 }}
                    />
                    {postType.value === 'Glass Bead Game' && (
                        <Column style={{ marginTop: 5 }}>
                            <SearchSelector
                                type='topic'
                                title='Choose a topic for the game'
                                placeholder={
                                    selectedArchetopic ? 'archetopic selected' : 'topic...'
                                }
                                style={{ marginBottom: 15 }}
                                state={topic.state}
                                disabled={!!selectedArchetopic}
                                errors={topic.errors}
                                onSearchQuery={(query) => findTopics(query)}
                                onOptionSelected={(selectedTopic) => selectTopic(selectedTopic)}
                                options={topicOptions}
                            />
                            {selectedArchetopic && (
                                <Row style={{ margin: '0 10px 10px 0' }} centerY>
                                    <div className={styles.archetopic}>
                                        <div>
                                            <selectedArchetopic.icon />
                                        </div>
                                        <p>{selectedArchetopic.name}</p>
                                    </div>
                                    <CloseButton
                                        size={17}
                                        onClick={() => {
                                            setSelectedArchetopic(null)
                                            updateValue('topic', '')
                                        }}
                                    />
                                </Row>
                            )}
                        </Column>
                    )}
                    {postType.value === 'Url' && (
                        <Input
                            title='Url'
                            type='text'
                            placeholder='url...'
                            style={{ marginBottom: 15 }}
                            loading={urlLoading}
                            state={url.state}
                            errors={url.errors}
                            value={url.value}
                            onChange={(value) => {
                                updateValue('url', value)
                                scrapeURL(value)
                            }}
                        />
                    )}
                    <Input
                        title={`Text${
                            postType.value === 'Url' ? ' (not required for url posts)' : ''
                        }`}
                        type='text-area'
                        placeholder='text...'
                        style={{ marginBottom: 15 }}
                        rows={3}
                        state={text.state}
                        errors={text.errors}
                        value={text.value}
                        onChange={(value) => updateValue('text', value)}
                    />
                    <SearchSelector
                        type='space'
                        title='Add any other spaces you want the post to appear in'
                        placeholder='space name or handle...'
                        style={{ marginBottom: 10 }}
                        onSearchQuery={(query) => findSpaces(query)}
                        onOptionSelected={(space) => addSpace(space)}
                        options={spaceOptions}
                    />
                    {selectedSpaces.length > 0 && (
                        <Row wrap>
                            {selectedSpaces.map((space) => (
                                <Row centerY style={{ margin: '0 10px 10px 0' }}>
                                    <ImageTitle
                                        type='user'
                                        imagePath={space.flagImagePath}
                                        title={`${space.name} (${space.handle})`}
                                        imageSize={27}
                                        style={{ marginRight: 3 }}
                                    />
                                    <CloseButton size={17} onClick={() => removeSpace(space.id)} />
                                </Row>
                            ))}
                        </Row>
                    )}
                    <Column style={{ margin: '20px 0 10px 0' }}>
                        <h2>Post preview</h2>
                        <PostCard
                            key={previewRenderKey}
                            location='preview'
                            post={{
                                text:
                                    postType.value === 'Url'
                                        ? text.value
                                        : text.value || '*sample text*',
                                type: postType.value.toLowerCase().split(' ').join('-'),
                                url: url.value,
                                urlImage,
                                urlDomain,
                                urlTitle,
                                urlDescription,
                                totalComments: 0,
                                totalLikes: 0,
                                totalRatings: 0,
                                totalReposts: 0,
                                totalLinks: 0,
                                Creator: {
                                    handle: accountData.handle,
                                    name: accountData.name,
                                    flagImagePath: accountData.flagImagePath,
                                },
                                DirectSpaces: [
                                    {
                                        ...spaceData,
                                        type: 'post',
                                        state: 'active',
                                    },
                                    ...selectedSpaces.map((s) => {
                                        return {
                                            ...s,
                                            type: 'post',
                                            state: 'active',
                                        }
                                    }),
                                ],
                                GlassBeadGame: {
                                    topic: topic.value,
                                },
                            }}
                        />
                    </Column>
                </Column>
                <Row>
                    <Button
                        text='Create Post'
                        colour='blue'
                        style={{ marginRight: 10 }}
                        disabled={urlLoading || loading || saved}
                        submit
                    />
                    {loading && <LoadingWheel />}
                    {saved && <SuccessMessage text='Post created!' />}
                </Row>
            </form>
        </Modal>
    )
}

export default CreatePostModal