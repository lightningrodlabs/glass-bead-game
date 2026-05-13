import React, { useCallback } from 'react'
import type { AgentPubKey } from '@holochain/client'
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js'

interface Props {
    agentPubKey: AgentPubKey | undefined
    size?: number
    disableTooltip?: boolean
    disableCopy?: boolean
    style?: React.CSSProperties
    className?: string
}

const AgentAvatar = (props: Props): JSX.Element | null => {
    const { agentPubKey, size = 40, disableTooltip, disableCopy, style, className } = props

    const setRef = useCallback(
        (el: HTMLElement | null) => {
            if (el && agentPubKey) (el as any).agentPubKey = agentPubKey
        },
        [agentPubKey]
    )

    if (!agentPubKey) return null

    return (
        <agent-avatar
            ref={setRef as any}
            size={size}
            disable-tooltip={disableTooltip || undefined}
            disable-copy={disableCopy || undefined}
            style={style}
            className={className}
        />
    )
}

export default AgentAvatar
