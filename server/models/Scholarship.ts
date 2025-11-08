import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Sponsor from "./Sponsor";

interface ScholarshipAttributes {
  scholarship_id: string;
  sponsor_id: string;
  status?: "draft" | "active" | "closed" | "suspended" | "archived";
  image_url?: string;
  type?: "merit_based" | "skill_based";
  purpose?: "allowance" | "tuition";
  title: string;
  description?: string;
  total_amount: number;
  total_slot: number;
  application_deadline?: Date;
  criteria: string[];
  required_documents: string[];
  custom_form_fields: any; 
  created_at?: Date;
  updated_at?: Date;
}

interface ScholarshipCreationAttributes extends Optional<ScholarshipAttributes, "scholarship_id"> {}

class Scholarship extends Model<ScholarshipAttributes, ScholarshipCreationAttributes> implements ScholarshipAttributes {
  public scholarship_id!: string;
  public sponsor_id!: string;
  public status?: "draft" | "active" | "closed" | "suspended" | "archived";
  public image_url?: string;
  public type?: "merit_based" | "skill_based";
  public purpose?: "allowance" | "tuition";
  public title!: string;
  public description?: string;
  public total_amount!: number;
  public total_slot!: number;
  public application_deadline?: Date;
  public criteria!: string[];
  public required_documents!: string[];
  public custom_form_fields!: any; 
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    Scholarship.belongsTo(models.Sponsor, {
      foreignKey: "sponsor_id",
      as: "sponsor",
    });
    Scholarship.hasMany(models.ScholarshipApplication, {
      foreignKey: "scholarship_id",
      as: "applications",
    });
  }
}

Scholarship.init(
  {
    scholarship_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, 
    },
    sponsor_id: {
      type: DataTypes.UUID,
      allowNull: false, 
      references: { 
        model: Sponsor,
        key: "sponsor_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "closed", "suspended", "archived"),
      allowNull: true,
      defaultValue: "active",
    },
    image_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("merit_based", "skill_based"),
      allowNull: true,
    },
    purpose: {
      type: DataTypes.ENUM("allowance", "tuition"),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false,
    },
    total_slot: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    application_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    criteria: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    required_documents: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    custom_form_fields: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Scholarship",
    tableName: "scholarships",
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
  }
);

export default Scholarship;