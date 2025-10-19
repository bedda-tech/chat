# Advanced AI Capabilities

## Document Purpose
This document outlines advanced AI capabilities that can be implemented in the bedda.ai chat application, leveraging the full potential of the AI SDK and AI Gateway to provide cutting-edge AI experiences.

## 1. Overview

Building upon the existing AI infrastructure, this plan introduces advanced AI capabilities that push the boundaries of what's possible with current AI technology, creating a truly intelligent and adaptive assistant.

**Key Capabilities**:
- Multi-modal AI interactions
- Advanced reasoning and problem-solving
- Autonomous task execution
- Intelligent content generation
- Predictive analytics and insights
- Adaptive learning and personalization

---

## 2. Multi-Modal AI Interactions

### 2.1 Advanced Vision Capabilities

**Feature**: Comprehensive image understanding and analysis

**Implementation**:
```typescript
// lib/ai/capabilities/vision-analyzer.ts
export class VisionAnalyzer {
  async analyzeImage(
    imageUrl: string,
    analysisType: VisionAnalysisType,
    context?: string
  ): Promise<VisionAnalysisResult> {
    const result = await generateObject({
      model: this.getVisionModel(),
      schema: this.getVisionSchema(analysisType),
      prompt: this.buildVisionPrompt(analysisType, context),
      images: [imageUrl]
    });
    
    return {
      analysis: result.object,
      confidence: this.calculateConfidence(result),
      metadata: {
        model: result.model,
        tokens: result.usage,
        processingTime: result.finishReason
      }
    };
  }
  
  async compareImages(
    image1Url: string,
    image2Url: string,
    comparisonType: ImageComparisonType
  ): Promise<ImageComparisonResult> {
    const result = await generateObject({
      model: this.getVisionModel(),
      schema: z.object({
        similarity: z.number().min(0).max(1),
        differences: z.array(z.object({
          type: z.string(),
          description: z.string(),
          location: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number()
          })
        })),
        overallAssessment: z.string()
      }),
      prompt: `Compare these two images for ${comparisonType}. Identify similarities and differences.`,
      images: [image1Url, image2Url]
    });
    
    return result.object;
  }
  
  async extractTextFromImage(
    imageUrl: string,
    options: OCROptions
  ): Promise<TextExtractionResult> {
    const result = await generateText({
      model: this.getVisionModel(),
      prompt: `Extract all text from this image. Preserve formatting and structure.`,
      images: [imageUrl]
    });
    
    return {
      text: result.text,
      confidence: this.calculateOCRConfidence(result),
      boundingBoxes: this.extractBoundingBoxes(result),
      language: this.detectLanguage(result.text)
    };
  }
  
  async generateImageDescription(
    imageUrl: string,
    style: DescriptionStyle
  ): Promise<ImageDescription> {
    const result = await generateText({
      model: this.getVisionModel(),
      prompt: this.buildDescriptionPrompt(style),
      images: [imageUrl]
    });
    
    return {
      description: result.text,
      style,
      keyElements: this.extractKeyElements(result.text),
      emotions: this.detectEmotions(result.text),
      accessibility: this.generateAccessibilityDescription(result.text)
    };
  }
}
```

**Benefits**:
- Comprehensive image understanding
- Accessibility improvements
- Advanced visual analysis

### 2.2 Audio Processing Capabilities

**Feature**: Advanced audio understanding and generation

**Implementation**:
```typescript
// lib/ai/capabilities/audio-processor.ts
export class AudioProcessor {
  async transcribeAudio(
    audioUrl: string,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const result = await transcribe({
      model: this.getAudioModel(),
      audio: audioUrl,
      language: options.language,
      prompt: options.prompt
    });
    
    return {
      text: result.text,
      language: result.language,
      confidence: result.confidence,
      segments: result.segments,
      speakers: this.identifySpeakers(result.segments),
      emotions: this.analyzeEmotions(result.segments)
    };
  }
  
  async generateSpeech(
    text: string,
    options: SpeechOptions
  ): Promise<SpeechResult> {
    const result = await generateSpeech({
      model: this.getTTSModel(),
      text,
      voice: options.voice,
      speed: options.speed,
      pitch: options.pitch
    });
    
    return {
      audio: result.audio,
      duration: result.duration,
      format: result.format,
      metadata: {
        voice: options.voice,
        language: result.language,
        quality: result.quality
      }
    };
  }
  
  async analyzeAudio(
    audioUrl: string,
    analysisType: AudioAnalysisType
  ): Promise<AudioAnalysisResult> {
    const result = await generateObject({
      model: this.getAudioModel(),
      schema: this.getAudioAnalysisSchema(analysisType),
      prompt: this.buildAudioAnalysisPrompt(analysisType),
      audio: audioUrl
    });
    
    return {
      analysis: result.object,
      confidence: this.calculateConfidence(result),
      metadata: {
        duration: result.duration,
        sampleRate: result.sampleRate,
        channels: result.channels
      }
    };
  }
}
```

**Benefits**:
- Advanced audio understanding
- Natural speech generation
- Multi-language support

---

## 3. Advanced Reasoning & Problem-Solving

### 3.1 Chain-of-Thought Reasoning

**Feature**: Step-by-step reasoning with transparency

**Implementation**:
```typescript
// lib/ai/capabilities/reasoning-engine.ts
export class ReasoningEngine {
  async solveProblem(
    problem: string,
    context: ProblemContext
  ): Promise<ReasoningResult> {
    const result = await generateText({
      model: this.getReasoningModel(),
      prompt: this.buildReasoningPrompt(problem, context),
      temperature: 0.3, // Lower temperature for more consistent reasoning
      maxTokens: 4000
    });
    
    return {
      solution: result.text,
      reasoningSteps: this.extractReasoningSteps(result.text),
      confidence: this.calculateConfidence(result),
      alternativeApproaches: this.generateAlternatives(problem, context),
      verification: await this.verifySolution(result.text, problem)
    };
  }
  
  async analyzeComplexScenario(
    scenario: string,
    variables: Record<string, any>
  ): Promise<ScenarioAnalysis> {
    const result = await generateObject({
      model: this.getReasoningModel(),
      schema: z.object({
        keyFactors: z.array(z.string()),
        potentialOutcomes: z.array(z.object({
          outcome: z.string(),
          probability: z.number(),
          impact: z.enum(['low', 'medium', 'high']),
          reasoning: z.string()
        })),
        recommendations: z.array(z.string()),
        risks: z.array(z.object({
          risk: z.string(),
          likelihood: z.number(),
          mitigation: z.string()
        }))
      }),
      prompt: this.buildScenarioAnalysisPrompt(scenario, variables)
    });
    
    return result.object;
  }
  
  async generateHypothesis(
    observation: string,
    domain: string
  ): Promise<Hypothesis[]> {
    const result = await generateObject({
      model: this.getReasoningModel(),
      schema: z.object({
        hypotheses: z.array(z.object({
          hypothesis: z.string(),
          reasoning: z.string(),
          testability: z.enum(['high', 'medium', 'low']),
          confidence: z.number()
        }))
      }),
      prompt: `Based on this observation in ${domain}: "${observation}", generate testable hypotheses.`
    });
    
    return result.object.hypotheses;
  }
}
```

**Benefits**:
- Transparent reasoning process
- Better problem-solving capabilities
- Educational value for users

### 3.2 Multi-Step Task Planning

**Feature**: Autonomous task planning and execution

**Implementation**:
```typescript
// lib/ai/capabilities/task-planner.ts
export class TaskPlanner {
  async createTaskPlan(
    goal: string,
    constraints: TaskConstraints
  ): Promise<TaskPlan> {
    const result = await generateObject({
      model: this.getPlanningModel(),
      schema: z.object({
        goal: z.string(),
        steps: z.array(z.object({
          id: z.string(),
          description: z.string(),
          dependencies: z.array(z.string()),
          estimatedDuration: z.number(),
          resources: z.array(z.string()),
          successCriteria: z.string()
        })),
        timeline: z.object({
          start: z.string(),
          end: z.string(),
          milestones: z.array(z.object({
            stepId: z.string(),
            deadline: z.string(),
            deliverables: z.array(z.string())
          }))
        }),
        risks: z.array(z.object({
          risk: z.string(),
          probability: z.number(),
          impact: z.enum(['low', 'medium', 'high']),
          mitigation: z.string()
        }))
      }),
      prompt: this.buildTaskPlanningPrompt(goal, constraints)
    });
    
    return result.object;
  }
  
  async executeTaskStep(
    stepId: string,
    context: ExecutionContext
  ): Promise<StepExecutionResult> {
    const step = await this.getTaskStep(stepId);
    if (!step) {
      throw new Error('Task step not found');
    }
    
    // Execute the step based on its type
    switch (step.type) {
      case 'research':
        return await this.executeResearchStep(step, context);
      case 'analysis':
        return await this.executeAnalysisStep(step, context);
      case 'generation':
        return await this.executeGenerationStep(step, context);
      case 'validation':
        return await this.executeValidationStep(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  
  async adaptPlan(
    planId: string,
    feedback: PlanFeedback
  ): Promise<AdaptedPlan> {
    const originalPlan = await this.getTaskPlan(planId);
    if (!originalPlan) {
      throw new Error('Task plan not found');
    }
    
    const result = await generateObject({
      model: this.getPlanningModel(),
      schema: z.object({
        adaptations: z.array(z.object({
          stepId: z.string(),
          change: z.string(),
          reason: z.string(),
          impact: z.enum(['low', 'medium', 'high'])
        })),
        newTimeline: z.object({
          start: z.string(),
          end: z.string(),
          changes: z.array(z.string())
        }),
        updatedRisks: z.array(z.object({
          risk: z.string(),
          probability: z.number(),
          impact: z.enum(['low', 'medium', 'high']),
          mitigation: z.string()
        }))
      }),
      prompt: this.buildPlanAdaptationPrompt(originalPlan, feedback)
    });
    
    return result.object;
  }
}
```

**Benefits**:
- Autonomous task execution
- Adaptive planning
- Risk management

---

## 4. Intelligent Content Generation

### 4.1 Advanced Content Creation

**Feature**: Sophisticated content generation with style adaptation

**Implementation**:
```typescript
// lib/ai/capabilities/content-generator.ts
export class ContentGenerator {
  async generateContent(
    request: ContentRequest,
    style: ContentStyle
  ): Promise<GeneratedContent> {
    const result = await generateText({
      model: this.getContentModel(),
      prompt: this.buildContentPrompt(request, style),
      temperature: style.creativity,
      maxTokens: request.maxLength
    });
    
    return {
      content: result.text,
      style: style.name,
      quality: this.assessQuality(result.text, request.requirements),
      suggestions: this.generateImprovements(result.text, style),
      metadata: {
        wordCount: this.countWords(result.text),
        readability: this.calculateReadability(result.text),
        sentiment: this.analyzeSentiment(result.text)
      }
    };
  }
  
  async adaptContent(
    content: string,
    targetAudience: AudienceProfile,
    platform: ContentPlatform
  ): Promise<AdaptedContent> {
    const result = await generateText({
      model: this.getContentModel(),
      prompt: this.buildAdaptationPrompt(content, targetAudience, platform),
      temperature: 0.7
    });
    
    return {
      adaptedContent: result.text,
      changes: this.identifyChanges(content, result.text),
      rationale: this.explainAdaptations(content, result.text),
      platformOptimizations: this.getPlatformOptimizations(result.text, platform)
    };
  }
  
  async generateVariations(
    content: string,
    variationCount: number,
    variationType: VariationType
  ): Promise<ContentVariation[]> {
    const variations = await Promise.all(
      Array.from({ length: variationCount }, (_, i) =>
        this.generateSingleVariation(content, variationType, i)
      )
    );
    
    return variations.map((variation, index) => ({
      id: `variation-${index}`,
      content: variation,
      type: variationType,
      differences: this.identifyDifferences(content, variation)
    }));
  }
}
```

**Benefits**:
- High-quality content generation
- Style adaptation
- Multiple variations

### 4.2 Creative Writing Assistance

**Feature**: Advanced creative writing support

**Implementation**:
```typescript
// lib/ai/capabilities/creative-writer.ts
export class CreativeWriter {
  async generateStory(
    prompt: string,
    genre: StoryGenre,
    length: StoryLength
  ): Promise<GeneratedStory> {
    const result = await generateText({
      model: this.getCreativeModel(),
      prompt: this.buildStoryPrompt(prompt, genre, length),
      temperature: 0.8, // Higher creativity
      maxTokens: this.getTokenLimit(length)
    });
    
    return {
      story: result.text,
      genre,
      length,
      elements: this.extractStoryElements(result.text),
      structure: this.analyzeStoryStructure(result.text),
      suggestions: this.generateStoryImprovements(result.text)
    };
  }
  
  async developCharacter(
    characterPrompt: string,
    depth: CharacterDepth
  ): Promise<CharacterProfile> {
    const result = await generateObject({
      model: this.getCreativeModel(),
      schema: z.object({
        name: z.string(),
        age: z.number(),
        background: z.string(),
        personality: z.object({
          traits: z.array(z.string()),
          motivations: z.array(z.string()),
          fears: z.array(z.string()),
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string())
        }),
        relationships: z.array(z.object({
          character: z.string(),
          relationship: z.string(),
          dynamics: z.string()
        })),
        backstory: z.string(),
        characterArc: z.string()
      }),
      prompt: this.buildCharacterPrompt(characterPrompt, depth)
    });
    
    return result.object;
  }
  
  async generateDialogue(
    characters: CharacterProfile[],
    context: DialogueContext
  ): Promise<GeneratedDialogue> {
    const result = await generateText({
      model: this.getCreativeModel(),
      prompt: this.buildDialoguePrompt(characters, context),
      temperature: 0.7
    });
    
    return {
      dialogue: result.text,
      characters: this.identifySpeakers(result.text),
      tone: this.analyzeDialogueTone(result.text),
      suggestions: this.generateDialogueImprovements(result.text, characters)
    };
  }
}
```

**Benefits**:
- Creative writing assistance
- Character development
- Story structure analysis

---

## 5. Predictive Analytics & Insights

### 5.1 Trend Analysis

**Feature**: Advanced trend analysis and prediction

**Implementation**:
```typescript
// lib/ai/capabilities/trend-analyzer.ts
export class TrendAnalyzer {
  async analyzeTrends(
    data: TrendData[],
    timeframe: TimeFrame,
    domain: string
  ): Promise<TrendAnalysis> {
    const result = await generateObject({
      model: this.getAnalyticsModel(),
      schema: z.object({
        trends: z.array(z.object({
          name: z.string(),
          direction: z.enum(['up', 'down', 'stable']),
          strength: z.number(),
          confidence: z.number(),
          timeframe: z.string(),
          factors: z.array(z.string())
        })),
        predictions: z.array(z.object({
          metric: z.string(),
          predictedValue: z.number(),
          confidence: z.number(),
          timeframe: z.string(),
          assumptions: z.array(z.string())
        })),
        insights: z.array(z.string()),
        recommendations: z.array(z.string())
      }),
      prompt: this.buildTrendAnalysisPrompt(data, timeframe, domain)
    });
    
    return result.object;
  }
  
  async predictOutcomes(
    scenario: string,
    variables: Record<string, any>,
    timeframe: string
  ): Promise<OutcomePrediction> {
    const result = await generateObject({
      model: this.getAnalyticsModel(),
      schema: z.object({
        outcomes: z.array(z.object({
          outcome: z.string(),
          probability: z.number(),
          impact: z.enum(['low', 'medium', 'high']),
          timeframe: z.string(),
          factors: z.array(z.string())
        })),
        keyVariables: z.array(z.object({
          variable: z.string(),
          influence: z.number(),
          sensitivity: z.number()
        })),
        scenarios: z.array(z.object({
          name: z.string(),
          description: z.string(),
          probability: z.number(),
          outcomes: z.array(z.string())
        }))
      }),
      prompt: this.buildPredictionPrompt(scenario, variables, timeframe)
    });
    
    return result.object;
  }
}
```

**Benefits**:
- Data-driven insights
- Predictive analytics
- Strategic recommendations

### 5.2 Personalization Engine

**Feature**: Adaptive personalization based on user behavior

**Implementation**:
```typescript
// lib/ai/capabilities/personalization-engine.ts
export class PersonalizationEngine {
  async analyzeUserBehavior(
    userId: string,
    timeframe: TimeFrame
  ): Promise<UserBehaviorAnalysis> {
    const userData = await this.getUserData(userId, timeframe);
    
    const result = await generateObject({
      model: this.getPersonalizationModel(),
      schema: z.object({
        preferences: z.object({
          communicationStyle: z.string(),
          detailLevel: z.enum(['high', 'medium', 'low']),
          preferredFormats: z.array(z.string()),
          workingHours: z.object({
            start: z.string(),
            end: z.string(),
            timezone: z.string()
          })
        }),
        patterns: z.array(z.object({
          pattern: z.string(),
          frequency: z.number(),
          confidence: z.number(),
          implications: z.string()
        })),
        recommendations: z.array(z.object({
          type: z.string(),
          suggestion: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          reasoning: z.string()
        }))
      }),
      prompt: this.buildBehaviorAnalysisPrompt(userData)
    });
    
    return result.object;
  }
  
  async personalizeResponse(
    baseResponse: string,
    userProfile: UserProfile,
    context: ResponseContext
  ): Promise<PersonalizedResponse> {
    const result = await generateText({
      model: this.getPersonalizationModel(),
      prompt: this.buildPersonalizationPrompt(baseResponse, userProfile, context),
      temperature: 0.6
    });
    
    return {
      personalizedResponse: result.text,
      adaptations: this.identifyAdaptations(baseResponse, result.text),
      reasoning: this.explainPersonalization(baseResponse, result.text, userProfile)
    };
  }
  
  async suggestContent(
    userId: string,
    context: ContentContext
  ): Promise<ContentSuggestion[]> {
    const userProfile = await this.getUserProfile(userId);
    const preferences = await this.getUserPreferences(userId);
    
    const result = await generateObject({
      model: this.getPersonalizationModel(),
      schema: z.object({
        suggestions: z.array(z.object({
          type: z.string(),
          title: z.string(),
          description: z.string(),
          relevance: z.number(),
          reasoning: z.string()
        }))
      }),
      prompt: this.buildContentSuggestionPrompt(userProfile, preferences, context)
    });
    
    return result.object.suggestions;
  }
}
```

**Benefits**:
- Personalized user experience
- Adaptive content recommendations
- Behavioral insights

---

## 6. Autonomous Task Execution

### 6.1 Smart Automation

**Feature**: Autonomous task execution with learning

**Implementation**:
```typescript
// lib/ai/capabilities/automation-engine.ts
export class AutomationEngine {
  async createAutomation(
    task: AutomationTask,
    triggers: AutomationTrigger[]
  ): Promise<Automation> {
    const automation: Automation = {
      id: generateId(),
      task,
      triggers,
      isActive: true,
      createdAt: new Date(),
      executionCount: 0,
      successRate: 0
    };
    
    await this.db.automations.create(automation);
    
    // Set up trigger listeners
    for (const trigger of triggers) {
      await this.setupTriggerListener(automation.id, trigger);
    }
    
    return automation;
  }
  
  async executeAutomation(
    automationId: string,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const automation = await this.db.automations.findById(automationId);
    if (!automation || !automation.isActive) {
      throw new Error('Automation not found or inactive');
    }
    
    try {
      const result = await this.executeTask(automation.task, context);
      
      // Update automation statistics
      automation.executionCount++;
      automation.successRate = this.calculateSuccessRate(automation);
      await this.db.automations.update(automation);
      
      return {
        success: true,
        result,
        executionTime: Date.now() - context.startTime,
        automationId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - context.startTime,
        automationId
      };
    }
  }
  
  async learnFromExecution(
    automationId: string,
    execution: ExecutionResult,
    feedback: UserFeedback
  ): Promise<void> {
    const automation = await this.db.automations.findById(automationId);
    if (!automation) {
      throw new Error('Automation not found');
    }
    
    // Update automation based on feedback
    if (feedback.rating > 0.7) {
      // Positive feedback - reinforce successful patterns
      await this.reinforcePatterns(automation, execution);
    } else {
      // Negative feedback - adjust automation
      await this.adjustAutomation(automation, execution, feedback);
    }
    
    // Update learning model
    await this.updateLearningModel(automationId, execution, feedback);
  }
}
```

**Benefits**:
- Autonomous task execution
- Learning from feedback
- Continuous improvement

### 6.2 Intelligent Workflow Orchestration

**Feature**: Complex workflow automation

**Implementation**:
```typescript
// lib/ai/capabilities/workflow-orchestrator.ts
export class WorkflowOrchestrator {
  async createWorkflow(
    definition: WorkflowDefinition,
    ownerId: string
  ): Promise<Workflow> {
    const workflow: Workflow = {
      id: generateId(),
      definition,
      ownerId,
      status: 'draft',
      createdAt: new Date(),
      executions: []
    };
    
    // Validate workflow definition
    await this.validateWorkflow(workflow);
    
    await this.db.workflows.create(workflow);
    
    return workflow;
  }
  
  async executeWorkflow(
    workflowId: string,
    input: WorkflowInput
  ): Promise<WorkflowExecution> {
    const workflow = await this.db.workflows.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    
    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId,
      input,
      status: 'running',
      startedAt: new Date(),
      steps: []
    };
    
    await this.db.workflowExecutions.create(execution);
    
    try {
      // Execute workflow steps
      for (const step of workflow.definition.steps) {
        const stepResult = await this.executeStep(step, execution);
        execution.steps.push(stepResult);
        
        // Check if workflow should continue
        if (stepResult.status === 'failed' && !step.continueOnError) {
          execution.status = 'failed';
          break;
        }
      }
      
      execution.status = 'completed';
      execution.completedAt = new Date();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.failedAt = new Date();
    }
    
    await this.db.workflowExecutions.update(execution);
    
    return execution;
  }
}
```

**Benefits**:
- Complex workflow automation
- Error handling and recovery
- Execution monitoring

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
- [ ] Multi-modal AI interactions
- [ ] Basic reasoning capabilities
- [ ] Content generation improvements
- [ ] User behavior tracking

### Phase 2: Advanced Features (Months 3-4)
- [ ] Advanced reasoning and problem-solving
- [ ] Creative writing assistance
- [ ] Trend analysis capabilities
- [ ] Personalization engine

### Phase 3: Automation (Months 5-6)
- [ ] Autonomous task execution
- [ ] Workflow orchestration
- [ ] Learning from feedback
- [ ] Advanced analytics

### Phase 4: Optimization (Months 7-8)
- [ ] Performance optimization
- [ ] Advanced personalization
- [ ] Predictive capabilities
- [ ] Integration improvements

---

## 8. Success Metrics

### Capability Metrics
- **Reasoning Quality**: 90% accuracy in problem-solving
- **Content Quality**: 4.5/5 user rating for generated content
- **Personalization**: 60% improvement in user engagement
- **Automation Success**: 80% success rate for automated tasks

### User Experience Metrics
- **User Satisfaction**: >4.5/5 rating for AI capabilities
- **Feature Adoption**: 70% of users using advanced features
- **Time Savings**: 50% reduction in task completion time
- **Learning Curve**: 80% of users comfortable with advanced features

### Technical Metrics
- **Response Time**: <3s for complex reasoning tasks
- **Accuracy**: 95% accuracy in content generation
- **Reliability**: 99% uptime for AI capabilities
- **Scalability**: Support for 100k+ concurrent users

---

## 9. Risk Mitigation

### Technical Risks
- **Model Limitations**: Implement fallback mechanisms and human oversight
- **Performance Issues**: Optimize models and implement caching
- **Accuracy Concerns**: Implement validation and feedback loops
- **Cost Management**: Monitor usage and implement cost controls

### User Experience Risks
- **Complexity**: Gradual feature rollout with user education
- **Dependency**: Maintain human oversight and control
- **Privacy**: Implement robust data protection measures
- **Bias**: Regular bias testing and model updates

---

**Document Version**: 1.0
**Created**: 2025-01-27
**Last Updated**: 2025-01-27
**Status**: Planning Phase
**Owner**: Development Team
**Next Review**: After Phase 1 completion
