import {
  makeStyles
} from '@material-ui/core';

export const useStyles = makeStyles(theme => {
  return {
    cardClass: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100% - 10px)', // for pages without content header
      marginBottom: '10px',
    },
    cardHeader: {
      paddingBottom: theme.spacing(1)
    },
    label: {
      color: theme.palette.text.secondary,
      textTransform: 'uppercase',
      fontSize: '0.9em',
      fontWeight: 'bold',
      letterSpacing: 0.5,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      marginBottom: theme.spacing(0.75)
    },
    progress: {
      width: "100%",
    },
    gridItemCardContent: {
      flex: 1,
    },
    container: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: theme.spacing(1.5),
      minHeight: "5.5em",
      overflow: 'auto',
    },
    miniCard: {
      minWidth: "12em",
      borderRadius: 5,
      borderColor: theme.palette.grey[600],
      borderStyle: 'solid',
      borderWidth: 1,
      padding: theme.spacing(1),
      marginRight: theme.spacing(1),
      '&:hover': {
        cursor: 'pointer',
        borderColor: theme.palette.primary.main
      },
    },
    environmentCardActive: {
      borderColor: theme.palette.primary.main
    },
    miniCardTitleContainer: {
      display: 'flex',
      flexDirection: 'row',
    },
    miniCardTitle: {
      fontSize: "1.1em",
    },
    environmentButton: {
      padding: 1
    },
    miniCardSubTitle: {
      fontSize: "0.9em"
    },
    deploymentStatus: {
      fontSize: "0.9em"
    },
    failColor: {
      color: theme.palette.error.main
    },
    successColor: {
      color: theme.palette.success.main
    },
    inProgressColor: {
      color: theme.palette.info.main
    },
    pendingColor: {
      color: theme.palette.primary.main
    },
    unknownColor: {
      color: theme.palette.text.secondary
    }
  }
});