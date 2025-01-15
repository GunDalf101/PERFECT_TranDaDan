import * as THREE from 'three';

class AdvancedAISystem {
    constructor() {
        this.COURT_BOUNDS = {
            minX: -5.5,
            maxX: 5.5,
            minY: 4.0387,
            maxY: 7,
            zPosition: -10
        };

        // Input simulation
        this.keyStates = {
            up: false,
            down: false
        };
        
        // Timing
        this.lastUpdateTime = 0;
        this.UPDATE_INTERVAL = 1000;
        this.reactionDelay = Math.random() * 100 + 100;
        
        // Movement
        this.paddleSpeed = 0.3;
        this.paddlePosition = { y: this.COURT_BOUNDS.minY };
        this.targetY = this.COURT_BOUNDS.minY;

        // Strategic behavior
        this.playStyle = 'NEUTRAL';
        this.aggressionLevel = 0.5;
        this.defensiveThreshold = 0.3;
        this.consecutiveHits = 0;
        this.rallyLength = 0;
        
        // Error simulation
        this.baseErrorRate = 0.1;
        this.fatigue = 0;
        this.fatigueIncreaseRate = 0.02;
        this.fatigueRecoveryRate = 0.01;
        this.lastMistakeTime = 0;
        this.mistakeRecoveryTime = 2000; // 2 seconds
        this.errorTypes = ['LATE', 'EARLY', 'OVERSHOOT', 'UNDERSHOOT'];
        this.currentErrorType = null;
        
        // Performance tracking
        this.hitCount = 0;
        this.missCount = 0;
        this.skillLevel = 0.9;
        
        // Strategy patterns
        this.strategies = {
            AGGRESSIVE: {
                speedMultiplier: 1.3,
                positionBias: 0.2,
                errorTolerance: 0.7
            },
            DEFENSIVE: {
                speedMultiplier: 0.8,
                positionBias: -0.1,
                errorTolerance: 0.9
            },
            NEUTRAL: {
                speedMultiplier: 1.0,
                positionBias: 0,
                errorTolerance: 0.8
            }
        };
    }

    updateStrategy(ball, playerScore, aiScore) {
        // Update fatigue
        this.fatigue = Math.min(1, this.fatigue + this.fatigueIncreaseRate);
        
        // Score-based strategy
        const scoreDiff = aiScore - playerScore;
        if (scoreDiff < -2) {
            this.playStyle = 'AGGRESSIVE';
            this.aggressionLevel = Math.min(1, this.aggressionLevel + 0.1);
        } else if (scoreDiff > 2) {
            this.playStyle = 'DEFENSIVE';
            this.aggressionLevel = Math.max(0, this.aggressionLevel - 0.1);
        }

        // Rally-based adjustments
        if (this.rallyLength > 10) {
            this.playStyle = 'DEFENSIVE';
            this.fatigue += this.fatigueIncreaseRate * 2;
        }

        // Recovery
        if (!this.currentErrorType && Math.random() < this.fatigue) {
            this.currentErrorType = this.errorTypes[Math.floor(Math.random() * this.errorTypes.length)];
            this.lastMistakeTime = performance.now();
        }

        // Clear error after recovery time
        if (this.currentErrorType && 
            performance.now() - this.lastMistakeTime > this.mistakeRecoveryTime) {
            this.currentErrorType = null;
            this.fatigue = Math.max(0, this.fatigue - this.fatigueRecoveryRate);
        }
    }

    predictBallTrajectory(ball, timeSpan = 1.0) {
        if (!ball || !ball.velocity) return null;
        if (ball.velocity.z >= 0) return null;

        const distanceToAI = Math.abs(this.COURT_BOUNDS.zPosition - ball.position.z);
        const timeToIntercept = distanceToAI / Math.abs(ball.velocity.z);

        // Base prediction
        let predictedY = ball.position.y + 
                        (ball.velocity.y * timeToIntercept) + 
                        (0.5 * -9.82 * timeToIntercept * timeToIntercept);

        // Apply strategy-based adjustments
        const strategy = this.strategies[this.playStyle];
        predictedY += strategy.positionBias;

        // Apply error based on current state
        if (this.currentErrorType) {
            switch (this.currentErrorType) {
                case 'LATE':
                    predictedY += 0.5 * this.fatigue;
                    break;
                case 'EARLY':
                    predictedY -= 0.5 * this.fatigue;
                    break;
                case 'OVERSHOOT':
                    predictedY *= (1 + 0.3 * this.fatigue);
                    break;
                case 'UNDERSHOOT':
                    predictedY *= (1 - 0.3 * this.fatigue);
                    break;
            }
        }

        // Constrain to court bounds
        return Math.max(
            this.COURT_BOUNDS.minY,
            Math.min(this.COURT_BOUNDS.maxY, predictedY)
        );
    }

    decideMovement(predictedPosition) {
        this.keyStates.up = false;
        this.keyStates.down = false;

        if (!predictedPosition) return;

        const currentY = this.paddlePosition.y;
        const moveThreshold = 0.1;
        const strategy = this.strategies[this.playStyle];

        // Apply strategy-specific movement
        const adjustedSpeed = this.paddleSpeed * strategy.speedMultiplier;
        const distanceToTarget = Math.abs(predictedPosition - currentY);

        if (distanceToTarget > moveThreshold) {
            if (predictedPosition > currentY) {
                this.keyStates.up = true;
                this.currentSpeed = adjustedSpeed;
            } else {
                this.keyStates.down = true;
                this.currentSpeed = adjustedSpeed;
            }
        }
    }

    applyMovement(aiPaddle, deltaTime) {
        const strategy = this.strategies[this.playStyle];
        const effectiveSpeed = this.paddleSpeed * 
                             strategy.speedMultiplier * 
                             (1 - this.fatigue * 0.3);

        if (this.keyStates.up) {
            aiPaddle.position.y += effectiveSpeed;
        }
        if (this.keyStates.down) {
            aiPaddle.position.y -= effectiveSpeed;
        }

        // Enforce boundaries
        aiPaddle.position.y = Math.max(
            this.COURT_BOUNDS.minY,
            Math.min(this.COURT_BOUNDS.maxY, aiPaddle.position.y)
        );
        aiPaddle.position.z = this.COURT_BOUNDS.zPosition;
    }

    update(ball, aiPaddle, deltaTime, playerScore, aiScore) {
        const currentTime = performance.now();
        this.paddlePosition = aiPaddle.position;

        // Update strategy
        this.updateStrategy(ball, playerScore, aiScore);

        // Decision refresh rate (1 second)
        if (currentTime - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
            const predictedY = this.predictBallTrajectory(ball);
            
            if (predictedY !== null) {
                this.targetY = predictedY;
                this.decideMovement(predictedY);
            } else {
                // Return to strategic position
                const neutralY = this.COURT_BOUNDS.minY + 
                               ((this.COURT_BOUNDS.maxY - this.COURT_BOUNDS.minY) * 0.5);
                this.targetY = neutralY + (this.strategies[this.playStyle].positionBias * 2);
                this.decideMovement(this.targetY);
            }

            this.lastUpdateTime = currentTime;
        }

        this.applyMovement(aiPaddle, deltaTime);
    }

    onHit() {
        this.hitCount++;
        this.consecutiveHits++;
        this.rallyLength++;
        this.skillLevel = Math.min(0.95, this.skillLevel + 0.01);
        this.fatigue = Math.min(1, this.fatigue + this.fatigueIncreaseRate);
    }

    onMiss() {
        this.missCount++;
        this.consecutiveHits = 0;
        this.rallyLength = 0;
        this.skillLevel = Math.max(0.85, this.skillLevel - 0.02);
        this.fatigue = Math.max(0, this.fatigue - this.fatigueRecoveryRate * 2);
    }

    reset() {
        this.keyStates.up = false;
        this.keyStates.down = false;
        this.lastUpdateTime = 0;
        this.targetY = this.COURT_BOUNDS.minY;
        this.playStyle = 'NEUTRAL';
        this.aggressionLevel = 0.5;
        this.consecutiveHits = 0;
        this.rallyLength = 0;
        this.fatigue = 0;
        this.currentErrorType = null;
        this.skillLevel = 0.9;
    }
}
export default AdvancedAISystem;