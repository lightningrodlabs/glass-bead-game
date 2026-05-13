import React, { useEffect, useRef } from 'react'
import {
    OverlayScrollbarsComponent,
    OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

const Scrollbars = (props: {
    id?: string
    className?: string
    onScrollBottom?: () => void
    onScrollTop?: () => void
    autoScrollToBottom?: boolean
    style?: React.CSSProperties
    children: React.ReactNode
}): JSX.Element => {
    const {
        id,
        className,
        onScrollBottom,
        onScrollTop,
        autoScrollToBottom,
        style,
        children,
    } = props
    const ref = useRef<OverlayScrollbarsComponentRef>(null)

    useEffect(() => {
        const instance = ref.current?.osInstance()
        if (!instance) return undefined
        const viewport = instance.elements().viewport as HTMLElement
        const handler = () => {
            const max = viewport.scrollHeight - viewport.clientHeight
            if (max <= 0) return
            const ratio = viewport.scrollTop / max
            if (onScrollBottom && ratio > 0.99) onScrollBottom()
            if (onScrollTop && ratio < 0.01) onScrollTop()
        }
        viewport.addEventListener('scroll', handler)
        return () => viewport.removeEventListener('scroll', handler)
    }, [onScrollBottom, onScrollTop])

    useEffect(() => {
        if (!autoScrollToBottom) return
        const instance = ref.current?.osInstance()
        if (!instance) return
        const viewport = instance.elements().viewport as HTMLElement
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    }, [autoScrollToBottom, React.Children.count(children)])

    return (
        <OverlayScrollbarsComponent
            id={id}
            className={`${className ?? ''} scrollbar-theme`}
            ref={ref}
            style={style}
            defer
        >
            {children}
        </OverlayScrollbarsComponent>
    )
}

export default Scrollbars
