import 'react'

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'profiles-context': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >
            'profile-prompt': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >
            'edit-profile': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    'allow-cancel'?: boolean
                    'save-profile-label'?: string
                },
                HTMLElement
            >
            'agent-avatar': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    size?: number
                    'disable-tooltip'?: boolean
                    'disable-copy'?: boolean
                },
                HTMLElement
            >
            'sl-tooltip': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    content?: string
                    placement?:
                        | 'top'
                        | 'top-start'
                        | 'top-end'
                        | 'right'
                        | 'right-start'
                        | 'right-end'
                        | 'bottom'
                        | 'bottom-start'
                        | 'bottom-end'
                        | 'left'
                        | 'left-start'
                        | 'left-end'
                    disabled?: boolean
                    distance?: number
                    open?: boolean
                    skidding?: number
                    trigger?: string
                    hoist?: boolean
                },
                HTMLElement
            >
        }
    }
}

export {}
