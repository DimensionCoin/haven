// modals/user.modal.ts
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
      required: true,
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
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: { unique: true },
    },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    // Privy server wallet public key (Solana)
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // NEW: Privy server wallet id
    walletId: {
      type: String,
      unique: true,
      sparse: true, // allow missing for old rows
      index: true,
    },

    walletProvider: { type: String, enum: ["privy"], default: "privy" },
    walletChain: { type: String, enum: ["solana"], default: "solana" },

    // Optional future PDA
    pdaAddress: { type: String, index: true, sparse: true },

    countryISO: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{2}$/,
      index: true,
    },

    displayCurrency: {
      type: String,
      default: "CAD",
      uppercase: true,
      match: /^[A-Z]{3}$/,
    },

    privyUserId: { type: String, index: true, sparse: true },

    address: { type: AddressSchema, required: true, select: false },

    dob: { type: Date, select: false },
    phoneNumber: { type: String, select: false, match: /^\+?[1-9]\d{1,14}$/ },

    kycStatus: {
      type: String,
      enum: ["none", "approved"],
      default: "none",
      index: true,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    riskLevelUpdatedAt: { type: Date },

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
  { timestamps: true, versionKey: false, minimize: false }
);

// ⚠️ Remove duplicate manual indexes for kycStatus/status to silence warnings
// (we already set `index: true` on the fields above)
UserSchema.index({ countryISO: 1 });
// email index is already defined inline as unique above; no need to add another.

UserSchema.pre("validate", function (next) {
  if (!this.displayCurrency && this.countryISO === "CA")
    this.displayCurrency = "CAD";
  next();
});
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
