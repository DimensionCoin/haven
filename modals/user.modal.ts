import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    stateOrProvince: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: {
      type: String,
      required: true, // ISO-3166 alpha-2
      uppercase: true,
      match: /^[A-Z]{2}$/,
    },
  },
  { _id: false }
);

const ConsentSchema = new Schema(
  {
    type: { type: String, required: true }, // 'tos' | 'privacy' | 'risk'
    version: { type: String, required: true },
    acceptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // loose email regex; rely on Clerk for strictness
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    walletAddress: {
      type: String,
      required: true,
      unique: true, // ensure one wallet per user
      index: true,
    },

    countryISO: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{2}$/,
    },

    displayCurrency: {
      type: String,
      default: "CAD",
      uppercase: true, // e.g., CAD, USD, EUR
      match: /^[A-Z]{3}$/,
    },

    address: {
      type: AddressSchema,
      required: true,
      select: false, // PII not returned by default
    },

    dob: { type: Date, select: false }, // PII
    phoneNumber: {
      type: String,
      select: false, // PII
      // optional E.164 check (e.g., +14165551234)
      match: /^\+?[1-9]\d{1,14}$/,
    },

    kycStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
      index: true,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    riskLevelUpdatedAt: { type: Date }, // track changes for audit

    features: {
      onramp: { type: Boolean, default: false },
      cards: { type: Boolean, default: false },
      lend: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "pending",
      index: true,
    },

    consents: [ConsentSchema],
  },
  {
    timestamps: true, // adds createdAt/updatedAt
    versionKey: false,
    minimize: false,
  }
);

// Helpful compound/indexes for common filters
UserSchema.index({ countryISO: 1 });
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ status: 1 });
// You already have unique clerkId; email uniqueness is nice to keep too:
UserSchema.index({ email: 1 }, { unique: true });

// Keep displayCurrency in sync with country on first set (optional)
UserSchema.pre("validate", function (next) {
  if (!this.displayCurrency && this.countryISO === "CA")
    this.displayCurrency = "CAD";
  next();
});

// Optional: update riskLevelUpdatedAt when risk changes
UserSchema.pre("save", function (next) {
  if (this.isModified("riskLevel")) this.riskLevelUpdatedAt = new Date();
  next();
});

export type IUser = mongoose.InferSchemaType<typeof UserSchema>;

let User: mongoose.Model<IUser>;
try {
  User = mongoose.model<IUser>("User");
} catch {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;
