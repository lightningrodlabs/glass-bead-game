import React, { useEffect, useRef } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

const Scrollbars = (props: {
    id?: string
    className?: string
    onScrollBottom?: () => void
    onScrollTop?: () => void
    autoScrollToBottom?: boolean
    style?: any
    children: any
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
    const ref = useRef<OverlayScrollbarsComponent>(null)
    const OSOptions = {
        className: 'os-theme-none',
        callbacks: {
            onScroll: () => {
                const instance = ref!.current!.osInstance()
                const scrollInfo = instance!.scroll()
                if (onScrollBottom && scrollInfo.ratio.y > 0.99) onScrollBottom()
                if (onScrollTop && scrollInfo.ratio.y < 0.01) onScrollTop()
            },
        },
    }

    useEffect(() => {
        if (autoScrollToBottom) {
            const instance = ref!.current!.osInstance()
            if (instance) instance.scroll([0, '100%'], 500)
        }
    }, [children.length])

    return (
        <OverlayScrollbarsComponent
            id={id}
            className={`${className} os-host-flexbox scrollbar-theme`}
            options={OSOptions}
            ref={ref}
            style={style}
        >
            {children}
        </OverlayScrollbarsComponent>
    )
}

Scrollbars.defaultProps = {
    id: null,
    className: null,
    onScrollBottom: null,
    onScrollTop: null,
    autoScrollToBottom: false,
    style: null,
}

export default Scrollbars
