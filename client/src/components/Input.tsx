import React from 'react'
import styles from '@styles/components/Input.module.scss'
import { resizeTextArea } from '@src/Helpers'
import LoadingWheel from '@components/LoadingWheel'
import { ReactComponent as DangerIconSVG } from '@svgs/exclamation-circle-solid.svg'
import { ReactComponent as SuccessIconSVG } from '@svgs/check-circle-solid.svg'

const Input = (props: {
    type: 'text' | 'number' | 'text-area' | 'password' | 'email'
    id?: string
    title?: string
    prefix?: string
    placeholder?: string
    state?: 'default' | 'valid' | 'invalid'
    errors?: string[]
    value?: string | number
    onChange?: (payload: string) => void
    rows?: number
    style?: any
    disabled?: boolean
    loading?: boolean
    autoFill?: boolean
}): JSX.Element => {
    const {
        type,
        id,
        title,
        prefix,
        placeholder,
        state,
        errors,
        value,
        onChange,
        rows,
        style,
        disabled,
        loading,
        autoFill,
    } = props

    return (
        <div className={`${styles.wrapper} ${disabled && styles.disabled}`} style={style}>
            {title && <h1>{title}</h1>}
            {state === 'invalid' && errors && errors.map((error) => <h2 key={error}>{error}</h2>)}
            <div className={styles[state || 'default']}>
                {prefix && <span>{prefix}</span>}
                {type === 'text-area' ? (
                    <textarea
                        id={id}
                        rows={rows}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => {
                            if (onChange) onChange(e.target.value)
                            resizeTextArea(e.target)
                        }}
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                ) : (
                    <input
                        id={id}
                        placeholder={placeholder}
                        type={type}
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        disabled={disabled}
                        data-lpignore={!autoFill}
                    />
                )}
                {state === 'invalid' && <DangerIconSVG />}
                {state === 'valid' && <SuccessIconSVG />}
                {loading && <LoadingWheel size={30} />}
            </div>
        </div>
    )
}

Input.defaultProps = {
    title: null,
    id: null,
    prefix: null,
    placeholder: null,
    state: 'default',
    errors: null,
    value: '',
    onChange: null,
    rows: null,
    style: null,
    disabled: false,
    loading: false,
    autoFill: false,
}

export default Input
