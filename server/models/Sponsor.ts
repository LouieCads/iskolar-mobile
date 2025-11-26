import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database"; 
import User from "./Users"

interface SponsorAttributes {
  sponsor_id: string;
  user_id: string;
  organization_name: string;
  organization_type?: 'non_profit' | 'private_company' | 'government_agency' | 'educational_institution' | 'foundation';
  contact_number: string;
  has_completed_profile?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SponsorCreationAttributes extends Optional<SponsorAttributes, "sponsor_id"> {}

class Sponsor extends Model<SponsorAttributes, SponsorCreationAttributes> implements SponsorAttributes {
  public sponsor_id!: string;
  public user_id!: string;
  public organization_name!: string;
  public organization_type?: 'non_profit' | 'private_company' | 'government_agency' | 'educational_institution' | 'foundation';
  public contact_number!: string;
  public has_completed_profile?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    Sponsor.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    Sponsor.hasMany(models.Scholarship, {
      foreignKey: "sponsor_id",
      as: "scholarships",
    });
  }
}

Sponsor.init(
  {
    sponsor_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false, 
      references: { 
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    organization_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    organization_type: {
      type: DataTypes.ENUM('non_profit', 'private_company', 'government_agency', 'educational_institution', 'foundation'),
      allowNull: true,
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    has_completed_profile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Sponsor",
    tableName: "sponsors",
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
  }
);

export default Sponsor;