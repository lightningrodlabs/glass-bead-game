import React, { useContext, useEffect, useRef } from 'react'
import type { EntryRecord } from '@holochain-open-dev/utils'
import type { Profile } from '@holochain-open-dev/profiles'
import Modal from '@components/Modal'
import { AppContext } from '@src/contexts'
import '@holochain-open-dev/profiles/dist/elements/edit-profile.js'

const EditProfileModal = (props: {
    profile: EntryRecord<Profile> | undefined
    onSaved: (profile: EntryRecord<Profile>) => void
    close: () => void
}): JSX.Element => {
    const { profile, onSaved, close } = props
    const ctx = useContext(AppContext)!
    const ref = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        ;(el as any).profile = profile
        ;(el as any).store = ctx.profilesStore
        ;(el as any).allowCancel = true

        const onSave = async (event: Event) => {
            const detail = (event as CustomEvent).detail as { profile: Profile }
            const saved = profile
                ? await ctx.profilesStore.client.updateProfile(detail.profile)
                : await ctx.profilesStore.client.createProfile(detail.profile)
            onSaved(saved)
            close()
        }
        const onCancel = () => close()

        el.addEventListener('save-profile', onSave)
        el.addEventListener('cancel-edit-profile', onCancel)
        return () => {
            el.removeEventListener('save-profile', onSave)
            el.removeEventListener('cancel-edit-profile', onCancel)
        }
    }, [profile, ctx.profilesStore, onSaved, close])

    return (
        <Modal close={close} centered>
            <h1>{profile ? 'Edit profile' : 'Create profile'}</h1>
            <edit-profile ref={ref as any} />
        </Modal>
    )
}

export default EditProfileModal
