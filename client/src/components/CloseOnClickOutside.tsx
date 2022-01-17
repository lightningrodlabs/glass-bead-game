import React, { useEffect, useRef } from 'react'

type ButtonEvent = MouseEvent;

const CloseOnClickOutside = (props: {
    onClick: () => void
    children: JSX.Element
}): JSX.Element => {
    const { onClick, children } = props
    const ref = useRef<HTMLDivElement>(null)
    function handleClickOutside(e: ButtonEvent) {
        const { current } = ref
        if (current && !current.contains(e.target as Node)) {
            onClick()
        }
    }
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    })
    return <div ref={ref}>{children}</div>
}

export default CloseOnClickOutside
