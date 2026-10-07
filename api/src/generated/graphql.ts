import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../lib/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Calendar date as YYYY-MM-DD. */
  Date: { input: string; output: string; }
};

export type CapacityRange = {
  __typename?: 'CapacityRange';
  /** The widened range actually used. */
  from: Scalars['Date']['output'];
  rows: Array<CapacityRow>;
  to: Scalars['Date']['output'];
  /** Monday of each week. */
  weeks: Array<Scalars['Date']['output']>;
};

/** Not normalised in Apollo: its arrays are per range. */
export type CapacityRow = {
  __typename?: 'CapacityRow';
  /** Hours, index-aligned with weeks. */
  allocated: Array<Scalars['Float']['output']>;
  /** Per week on purpose, so effective-dated capacity later doesn't change the contract. */
  capacity: Array<Scalars['Float']['output']>;
  person: Person;
};

export type Mutation = {
  __typename?: 'Mutation';
  updateWeeklyHours: Person;
};


export type MutationUpdateWeeklyHoursArgs = {
  id: Scalars['ID']['input'];
  weeklyHours: Scalars['Float']['input'];
};

export type Person = {
  __typename?: 'Person';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  weeklyHours: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Allocated vs capacity per person per week. Range is widened to whole ISO weeks (Mon–Sun), max 26 weeks. */
  capacity: CapacityRange;
};


export type QueryCapacityArgs = {
  from: Scalars['Date']['input'];
  to: Scalars['Date']['input'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CapacityRange: ResolverTypeWrapper<CapacityRange>;
  CapacityRow: ResolverTypeWrapper<CapacityRow>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Person: ResolverTypeWrapper<Person>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CapacityRange: CapacityRange;
  CapacityRow: CapacityRow;
  Date: Scalars['Date']['output'];
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Mutation: Record<PropertyKey, never>;
  Person: Person;
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
};

export type CapacityRangeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CapacityRange'] = ResolversParentTypes['CapacityRange']> = {
  from?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  rows?: Resolver<Array<ResolversTypes['CapacityRow']>, ParentType, ContextType>;
  to?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  weeks?: Resolver<Array<ResolversTypes['Date']>, ParentType, ContextType>;
};

export type CapacityRowResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CapacityRow'] = ResolversParentTypes['CapacityRow']> = {
  allocated?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  capacity?: Resolver<Array<ResolversTypes['Float']>, ParentType, ContextType>;
  person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  updateWeeklyHours?: Resolver<ResolversTypes['Person'], ParentType, ContextType, RequireFields<MutationUpdateWeeklyHoursArgs, 'id' | 'weeklyHours'>>;
};

export type PersonResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  weeklyHours?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  capacity?: Resolver<ResolversTypes['CapacityRange'], ParentType, ContextType, RequireFields<QueryCapacityArgs, 'from' | 'to'>>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  CapacityRange?: CapacityRangeResolvers<ContextType>;
  CapacityRow?: CapacityRowResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Person?: PersonResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
};

