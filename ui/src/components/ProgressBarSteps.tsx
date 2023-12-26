import React from 'react'
import styles from '@styles/components/ProgressBarSteps.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import { ReactComponent as TickIcon } from '@svgs/check-solid.svg'

const ProgressBarSteps = (props: {
    steps: string[]
    currentStep: number
    style?: any
}): JSX.Element => {
    const { steps, currentStep, style } = props

    return (
        <Column centerX className={styles.wrapper} style={style}>
            <Row
                centerY
                style={{
                    width: `calc((100% - (100% / ${steps.length})) + 30px)`,
                    alignItems: 'stretch',
                }}
            >
                {steps.map((step, index) => (
                    <React.Fragment key={step}>
                        <Column
                            centerX
                            centerY
                            className={`${styles.circle} ${
                                index > currentStep - 1 && styles.todo
                            } ${index < currentStep - 1 && styles.done}`}
                        >
                            {index < currentStep - 1 ? <TickIcon /> : <p>{index + 1}</p>}
                        </Column>
                        {index < steps.length - 1 && (
                            <Column
                                centerY
                                className={`${styles.line} ${
                                    index > currentStep - 2 && styles.todo
                                }`}
                            >
                                <div />
                            </Column>
                        )}
                    </React.Fragment>
                ))}
            </Row>
            <Row className={styles.text}>
                {steps.map((step, index) => (
                    <Row key={step} centerX style={{ width: '100%' }}>
                        <p className={`${index > currentStep - 1 && styles.todo}`}>{step}</p>
                    </Row>
                ))}
            </Row>
        </Column>
    )
}

ProgressBarSteps.defaultProps = {
    style: null,
}

export default ProgressBarSteps
