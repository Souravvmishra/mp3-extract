import Algebraic_questions_easy_50 from './data/Quant/Algebraic/easy.json'
import Algebraic_questions_hard_50 from './data/Quant/Algebraic/hard.json'
import Algebraic_questions_medium_50 from './data/Quant/Algebraic/medium.json'

import Arithmetic_questions_easy_50 from './data/Quant/Arithmetic/easy.json'
import Arithmetic_questions_hard_50 from './data/Quant/Arithmetic/hard.json'
import Arithmetic_questions_medium_50 from './data/Quant/Arithmetic/medium.json'

import Geometry_questions_easy_50 from './data/Quant/Geometry/easy.json'
import Geometry_questions_hard_50 from './data/Quant/Geometry/hard.json'
import Geometry_questions_medium_50 from './data/Quant/Geometry/medium.json'

import Statistics_questions_easy_50 from './data/Quant/Statistics/easy.json'
import Statistics_questions_hard_50 from './data/Quant/Statistics/hard.json'
import Statistics_questions_medium_50 from './data/Quant/Statistics/medium.json'

import Analogy_questions_easy_50 from './data/Verbal/Analogy/easy.json'
import Analogy_questions_hard_50 from './data/Verbal/Analogy/hard.json'
import Analogy_questions_medium_50 from './data/Verbal/Analogy/medium.json'


import SenetenceCompletion_questions_easy_50 from './data/Verbal/Senetence Completion/easy.json'
import SenetenceCompletion_questions_hard_50 from './data/Verbal/Senetence Completion/hard.json'
import SenetenceCompletion_questions_medium_50 from './data/Verbal/Senetence Completion/medium.json'


// Category Enum
export enum Category {
  Quant = 'quant',
  Verbal = 'Verbal',
}

// Topics under Quant
export enum QuantTopic {
  Algebraic = 'Algebra',
  Arithmetic = 'Arithmetic',
  Geometry = 'Geometry',
  Statistics = 'Statistics',
}

// Topics under Verbal
export enum VerbalTopic {
  Analogy = 'Analogy',
  SentenceCompletion = 'Sentence Completion',
}

// Difficulty Type
export type Difficulty = 'easy' | 'medium' | 'hard';

// Common Question Interface
interface BaseQuestion {
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: string;
  explanation: string;
  difficulty: Difficulty;
}

// Discriminated Union for Category-Topic Mapping
export type Question =
  | (BaseQuestion & {
      category: Category.Quant;
      topic: QuantTopic;
    })
  | (BaseQuestion & {
      category: Category.Verbal;
      topic: VerbalTopic;
    });




export const questions = [
    ...Algebraic_questions_easy_50,
    ...Algebraic_questions_hard_50,
    ...Algebraic_questions_medium_50,
    ...Arithmetic_questions_easy_50,
    ...Arithmetic_questions_hard_50,
    ...Arithmetic_questions_medium_50,
    ...Geometry_questions_easy_50,
    ...Geometry_questions_hard_50,
    ...Geometry_questions_medium_50,
    ...Statistics_questions_easy_50,
    ...Statistics_questions_hard_50,
    ...Statistics_questions_medium_50,
    ...Analogy_questions_easy_50,
    ...Analogy_questions_hard_50,
    ...Analogy_questions_medium_50,
    ...SenetenceCompletion_questions_easy_50,
    ...SenetenceCompletion_questions_hard_50,
    ...SenetenceCompletion_questions_medium_50,
]
